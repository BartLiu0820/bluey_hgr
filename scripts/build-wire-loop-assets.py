"""Deterministic exports of image_gen originals; never generates source artwork."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import subprocess
import sys

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/wire-loop'
PROCESSOR = Path('/Users/sansanaixuexi/.codex/skills/generate2dsprite/scripts/generate2dsprite.py')
spec = importlib.util.spec_from_file_location('sprite_processor', PROCESSOR)
sprite = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sprite)
PLAN = json.loads((ROOT / 'wire-loop-assets.plan.json').read_text())
LANCZOS = Image.Resampling.LANCZOS


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def despill(image):
    """Unmix residual magenta at antialiased edges; retain generated RGB elsewhere."""
    a = np.array(image.convert('RGBA')).astype(np.float32)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    contamination = np.maximum(0, np.minimum(r - g, b - g))
    mask = (contamination > 10) & (a[:, :, 3] > 0)
    coverage = np.maximum(.01, 1 - contamination / 255)
    for channel, background in enumerate([255, 0, 255]):
        recovered = (a[:, :, channel] - (1 - coverage) * background) / coverage
        a[:, :, channel] = np.where(mask, recovered, a[:, :, channel])
    a[:, :, 3] = np.where(mask, a[:, :, 3] * coverage, a[:, :, 3])
    a = np.uint8(np.clip(a, 0, 255))
    a[a[:, :, 3] == 0] = 0
    return Image.fromarray(a, 'RGBA')


def clean_source(folder):
    target = folder / 'raw-sheet-clean.png'
    if not target.exists():
        source = Image.open(folder / 'raw-sheet.png').convert('RGBA')
        cleaned = despill(sprite.remove_bg_magenta(source, 100, 150))
        cleaned.save(target, optimize=True)
    return Image.open(target).convert('RGBA')


def fit(image, size, box=None, bottom=False):
    box = box or image.getbbox()
    assert box, 'empty generated source'
    cropped = image.crop(box)
    ratio = min(size[0] * .9 / cropped.width, size[1] * .9 / cropped.height)
    scaled = cropped.resize((round(cropped.width * ratio), round(cropped.height * ratio)), LANCZOS)
    position = ((size[0] - scaled.width) // 2,
                round(size[1] * .95) - scaled.height if bottom else (size[1] - scaled.height) // 2)
    out = Image.new('RGBA', size)
    out.paste(scaled, position)
    return despill(out), {'crop': list(box), 'scale': ratio, 'paste': list(position)}


def point(transform, source):
    return [round((source[i] - transform['crop'][i]) * transform['scale'] + transform['paste'][i], 3) for i in range(2)]


def image_qc(image):
    a = np.array(image.convert('RGBA'))
    alpha = a[:, :, 3]
    rgb = a[:, :, :3].astype(int)
    bbox = image.getbbox()
    fringe = (rgb[:, :, 0] > rgb[:, :, 1] + 25) & (rgb[:, :, 2] > rgb[:, :, 1] + 25) & (alpha > 32)
    return {'size': list(image.size), 'mode': image.mode, 'bbox': list(bbox) if bbox else None,
            'nonEmpty': bool(bbox), 'cornerAlpha': [int(alpha[y, x]) for x, y in [(0, 0), (-1, 0), (0, -1), (-1, -1)]],
            'edgeAlphaPixels': int(np.count_nonzero(alpha[0]) + np.count_nonzero(alpha[-1]) + np.count_nonzero(alpha[:, 0]) + np.count_nonzero(alpha[:, -1])),
            'magentaSpillPixels': int(fringe.sum())}


def material(asset, folder, cleaned):
    box = cleaned.getbbox()
    cx, cy = (box[0] + box[2]) // 2, (box[1] + box[3]) // 2
    crop = (cx - 256, cy - 32, cx + 256, cy + 32)
    source = cleaned.crop(crop).convert('RGB')
    assert cleaned.crop(crop).getchannel('A').getextrema() == (255, 255)
    top = Image.new('RGB', (1024, 64))
    top.paste(source, (0, 0)); top.paste(ImageOps.mirror(source), (512, 0))
    out = Image.new('RGB', (1024, 128))
    out.paste(top, (0, 0)); out.paste(ImageOps.flip(top), (0, 64))
    out.save(folder / 'material.png', optimize=True)
    repeat = Image.new('RGB', (1024, 512))
    for y in range(4):
        repeat.paste(out, (0, y * 128))
    repeat.save(folder / 'repeat-preview.png', optimize=True)
    data = np.array(out).astype(int)
    meta = {'method': 'interior crop at native scale; horizontal and vertical mirror pair, no painted or procedural replacement',
            'sourceCrop': crop, 'sourceSize': list(cleaned.size), 'targetSize': list(out.size),
            'wrapS': 'repeat', 'wrapT': 'repeat', 'colorSpace': 'sRGB',
            'edgeMaxDifferenceX': int(np.abs(data[:, 0] - data[:, -1]).max()),
            'edgeMaxDifferenceY': int(np.abs(data[0] - data[-1]).max()),
            'geometryIntegration': 'pending; no render/collision claim'}
    write_json(folder / 'uv-crop.json', meta)
    return [folder / 'material.png'], meta


def static_asset(asset, folder, cleaned):
    slug, size = asset['slug'], tuple(asset['targetSize'])
    shared_box = None
    if slug in ['start-dock', 'finish-dock']:
        boxes = [clean_source(ASSETS / s).getbbox() for s in ['start-dock', 'finish-dock']]
        shared_box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    out, transform = fit(cleaned, size, shared_box, slug in ['start-dock', 'finish-dock'])
    name = 'appearance.png' if slug == 'probe-master' else slug + '.png'
    out.save(folder / name, optimize=True)
    meta = {'method': 'shared-crop dock pair' if shared_box else 'aspect-preserving crop and pad',
            'sourceSize': list(cleaned.size), 'targetSize': list(size), 'transform': transform}
    if slug == 'probe-master':
        anchor = point(transform, [513, 458])
        write_json(folder / 'attachment.json', {'image': name, 'anchor': 'ring-center', 'sourcePoint': [513, 458], 'pointPx': anchor,
                   'referenceOnly': True, 'note': 'Visually annotated appearance center, NOT a collision radius or frozen geometry contract.'})
    if slug == 'handle-stem':
        anchor = point(transform, [512, 196])
        write_json(folder / 'attachment.json', {'image': name, 'anchor': 'stem-tip', 'sourcePoint': [512, 196], 'pointPx': anchor,
                   'directionFromAnchor': [0, 1], 'collisionRole': 'visual_only', 'geometryIntegration': 'pending'})
    if slug in ['start-dock', 'finish-dock']:
        write_json(folder / 'attachment.json', {'image': name, 'baseContactPx': point(transform, [627, 1065]),
                   'saddleRestPx': point(transform, [627, 449]), 'sourceBaseContact': [627, 1065],
                   'sourceSaddleRest': [627, 449], 'sharedTransform': transform,
                   'collisionRole': 'visual_only', 'geometryIntegration': 'pending'})
    if slug == 'timer-plaque':
        p0, p1 = point(transform, [420, 355]), point(transform, [1370, 665])
        write_json(folder / 'content-insets.json', {'image': name, 'canvasSize': list(size),
                   'textRectPx': [p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]],
                   'note': 'Seconds and all text are HTML; clear rectangle excludes stopwatch, rim and leaves.'})
    return [folder / name], meta


def fx(asset, folder, cleaned):
    """Keep one scale. Align only the annotated central motif, never particle bbox."""
    slug = asset['slug']; duration = 70 if slug == 'contact-flash' else 110
    prefix = 'contact' if slug == 'contact-flash' else 'finish'
    output = folder / 'processed'; output.mkdir(exist_ok=True)
    # Raw source points annotated from the visible central glint/star, not an invisible presumed grid.
    origins = ([[315, 358], [929, 358], [315, 936], [929, 936]] if slug == 'contact-flash'
               else [[327, 335], [915, 335], [334, 902], [915, 907]])
    frames = []; cells = []; factor = .4
    for i, origin in enumerate(origins):
        x0, y0 = (i % 2) * 627, (i // 2) * 627
        cell = cleaned.crop((x0, y0, x0 + 627, y0 + 627))
        origin_local = [origin[0] - x0, origin[1] - y0]
        # Affine resampling translates the semantic source origin to (128,128).
        frame = cell.transform((256, 256), Image.Transform.AFFINE,
                  (1 / factor, 0, origin_local[0] - 128 / factor,
                   0, 1 / factor, origin_local[1] - 128 / factor), Image.Resampling.BICUBIC)
        frame = despill(frame)
        frame.save(output / f'{prefix}-{i + 1}.png', optimize=True)
        frames.append(frame)
        cells.append({'sourceCell': [x0, y0, 627, 627], 'sourceOriginPx': origin,
                      'outputOriginPx': [128, 128], 'uniformScale': factor, 'qc': image_qc(frame)})
    sprite.compose_sheet(frames, 2, 2, 256).save(output / 'sheet-transparent.png', optimize=True)
    sprite.save_transparent_gif(frames, output / 'animation.gif', duration)
    sprite.save_transparent_gif(frames, output / 'animation-half-speed.gif', duration * 2)
    write_json(folder / 'animation.json', {'frames': [f'processed/{prefix}-{i + 1}.png' for i in range(4)],
               'frameSize': [256, 256], 'frameDurationsMs': [duration] * 4, 'loop': False,
               'originPx': [128, 128], 'onComplete': 'hide', 'gifIsLoopingReviewOnly': True})
    meta = {'method': 'magenta cleanup + uniform affine extraction, annotated central motif aligned; no per-frame scale',
            'uniformScale': factor, 'frames': cells, 'sourceGrid': [2, 2],
            'originAnnotationToleranceSourcePx': 3, 'runtimeIntegration': 'pending'}
    write_json(output / 'pipeline-meta.json', meta)
    return [output / f'{prefix}-{i + 1}.png' for i in range(4)], meta


def process_asset(asset):
    slug = asset['slug']; folder = ASSETS / slug
    request = json.loads((folder / 'generation-request.json').read_text())
    # Preserve the original planned wording and make prompt-used match the actual tool call.
    brief = folder / 'brief-prompt.txt'
    if not brief.exists():
        brief.write_text((folder / 'prompt-used.txt').read_text())
    (folder / 'prompt-used.txt').write_text(request['prompt'] + '\n')
    compact = asset['processorProfile'] == 'compact_single'
    animated = asset['frames'] == 4
    if compact or animated:
        processor_out = folder / 'processor-qc'
        if not (processor_out / 'pipeline-meta.json').exists():
            cmd = [sys.executable, str(PROCESSOR), 'process', '--input', str(folder / 'raw-sheet.png'),
                   '--target', 'asset', '--mode', 'impact' if animated else 'single',
                   '--output-dir', str(processor_out), '--prompt-file', str(folder / 'prompt-used.txt')]
            if animated:
                cmd += ['--rows', '2', '--cols', '2', '--cell-size', '256', '--fit-scale', '.78', '--shared-scale',
                        '--align', 'center', '--scale-strategy', 'preserve', '--component-mode', 'all',
                        '--label-prefix', 'contact' if slug == 'contact-flash' else 'finish', '--strict-qc',
                        '--duration', '70' if slug == 'contact-flash' else '110']
            else:
                cmd += ['--single-size', str(asset['targetSize'][0])]
            result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
            (folder / 'processor-command.json').write_text(json.dumps(cmd, indent=2) + '\n')
            (folder / 'processor-qc.log').write_text(result.stdout + result.stderr)
            if result.returncode:
                raise RuntimeError(f'{slug}: processor failed, see processor-qc.log')
        if animated and not (folder / 'raw-sheet-clean.png').exists():
            despill(Image.open(processor_out / 'raw-sheet-clean.png')).save(folder / 'raw-sheet-clean.png', optimize=True)
    cleaned = clean_source(folder)
    if asset['processorProfile'] == 'material_source':
        exports, details = material(asset, folder, cleaned)
    elif animated:
        exports, details = fx(asset, folder, cleaned)
    else:
        exports, details = static_asset(asset, folder, cleaned)
    checks = []
    for path in exports:
        im = Image.open(path)
        qc = image_qc(im)
        qc.update({'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size, 'sha256': digest(path)})
        if asset['processorProfile'] != 'material_source':
            assert qc['nonEmpty'] and qc['mode'] == 'RGBA' and not qc['edgeAlphaPixels'] and qc['cornerAlpha'] == [0] * 4, (slug, qc)
            assert qc['magentaSpillPixels'] == 0, (slug, 'magenta fringe', qc['magentaSpillPixels'])
        checks.append(qc)
    meta = {'id': asset['id'], 'slug': slug, 'generatedAt': '2026-08-31', 'generator': 'built-in image_gen',
            'sourceSize': list(Image.open(folder / 'raw-sheet.png').size), 'sourceSha256': digest(folder / 'raw-sheet.png'),
            'processing': details, 'exports': checks, 'pixelQc': 'pass',
            'visualReview': 'pending', 'geometryIntegration': 'not_started', 'runtimeIntegration': 'not_started'}
    write_json(folder / 'pipeline-meta.json', meta)
    print(f'{asset["id"]} {slug}: {len(exports)} exports, pixel QC pass', flush=True)
    return meta


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--slug'); args = parser.parse_args()
    result = []
    for asset in PLAN['assets']:
        if asset['kind'] == 'image' and (not args.slug or asset['slug'] == args.slug):
            result.append(process_asset(asset))
    if not args.slug:
        write_json(ASSETS / 'pixel-qc.json', {'assets': result,
                   'imageTasks': len(result), 'exportImages': sum(len(a['exports']) for a in result),
                   'runtimeImageBytes': sum(e['bytes'] for a in result for e in a['exports'] if a['slug'] != 'probe-master'),
                   'audio': 'blocked_missing_credential', 'geometryAndRuntime': 'not_started'})


if __name__ == '__main__':
    main()
