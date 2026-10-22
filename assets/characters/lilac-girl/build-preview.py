"""Validate and package generated sprites; does not generate or redraw artwork."""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
ACTIONS = {'idle': ('待机', 240), 'run': ('跑步', 120), 'jump': ('跳跃', 170),
           'hover': ('悬浮', 180), 'hurt': ('受惊／救援', 190), 'bump': ('碰撞', 170),
           'celebrate': ('庆祝', 190)}
GROUNDED = {'idle', 'run', 'bump', 'celebrate'}

def build():
    roster = json.loads((ROOT.parent / 'character-roster.json').read_text())
    assert set(ACTIONS) == set(roster['runtimeActionContract'])
    profile = json.loads((ROOT / 'character-scale-profile.json').read_text())
    checks, action_contracts = {}, {}
    for action, (label, duration) in ACTIONS.items():
        meta = json.loads((ROOT / action / 'pipeline-meta.json').read_text())
        q = meta['qc_summary']
        assert meta['qc_config']['strict_qc']
        assert not any(meta[k] for k in ('empty_frames', 'edge_touch_frames', 'paste_clamped_frames'))
        assert q.get('profile_body_scale_drift', 0) <= .08, action
        assert meta['output_origin'] == profile['output_origin']
        for key in ('cell_size', 'fit_scale', 'align', 'scale_strategy', 'component_mode'):
            assert meta[key] == profile['processing'][key], (action, key)
        if action in GROUNDED:
            assert q['body_scale_cv'] <= .08 and q['anchor_y_std'] <= .05
        hashes, paths = [], []
        for index in range(1, 5):
            path = ROOT / action / f'{action}-{index}.png'
            im = Image.open(path)
            assert im.mode == 'RGBA' and im.size == (256, 256)
            assert im.getchannel('A').getextrema() == (0, 255)
            assert im.getbbox() and im.getbbox()[0] > 0 and im.getbbox()[2] < 256
            assert not any(a > 64 and r > 220 and g < 70 and b > 220 for r,g,b,a in im.getdata()), path
            hashes.append(hashlib.sha256(path.read_bytes()).hexdigest())
            paths.append(f'{action}/{action}-{index}.png')
        assert len(set(hashes)) == 4, action
        gif = Image.open(ROOT / action / 'animation.gif')
        assert gif.n_frames == 4 and 'transparency' in gif.info
        assert gif.info['duration'] == duration
        checks[action] = {'status': 'PASS', 'frameCount': 4, 'qc': q, 'frameSha256': hashes}
        action_contracts[action] = {'label': label, 'frameDurationMs': duration, 'frames': paths,
                                    'sheet': f'{action}/sheet-transparent.png', 'gif': f'{action}/animation.gif'}

    manifest = {'version': 3, 'id': 'lilac-girl', 'displayName': '棉棉',
                'assetRoot': 'lilac-girl', 'status': 'integrated',
                'thumbnail': 'idle/idle-1.png', 'artRevision': 'youyou-eyes-v2',
                'styleReference': 'garden-girl', 'faceMaster': 'references/face-style-master.png',
                'runtimeActionContract': list(ACTIONS),
                'framesPerAction': 4,
                'sheet': {'rows': 2, 'cols': 2, 'cellSize': 256, 'facing': 'right', 'anchor': 'feet', 'transparent': True},
                'outputOrigin': profile['output_origin'], 'scaleProfile': 'character-scale-profile.json',
                'actions': action_contracts,
                'notes': ['眼睛与脸部参考悠悠的大眼睛画风；七动作统一，保留原服装、身高和动作语义。',
                          '运行时负责跳跃、悬浮与救援的世界坐标位移；素材保留屈膝、后仰等姿态变化。',
                          '同一共享缩放系数用于所有动作；未逐帧缩放，也不需要逐动作运行时缩放补偿。',
                          '已作为棉棉接入游戏角色名单、HTML 角色定义和六角色选择；复用原有三玩法与碰撞规则。',
                          '用户照片派生形象，仅用于本次项目素材；未上传或发布到外部网站。']}
    (ROOT / 'character-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    report = {'status': 'PASS', 'artRevision': 'youyou-eyes-v2', 'actions': 7, 'frames': 28, 'generation': 'built-in image_gen',
              'processor': 'generate2dsprite', 'bodyScaleDriftLimit': .08,
              'groundedBodyScaleCvLimit': .08, 'groundedAnchorYStdLimit': .05,
              'airborneNote': '跳跃/悬浮/救援不使用站立姿态的原始 y 稳定性门槛；仍检查同一共享缩放、体量漂移、空帧、裁切和透明度。',
              'checks': checks}
    (ROOT / 'qc-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    shutil.copy2(ROOT.parent / 'photo-girl-peace-20260831.png', ROOT / 'references' / 'portrait.png')

    # Deterministic contact sheet: composite the finished PNGs without redrawing characters.
    board = Image.new('RGB', (1184, 7 * 274 + 98), '#f8f5ef')
    draw = ImageDraw.Draw(board)
    font_path = '/System/Library/Fonts/Supplemental/Arial.ttf'
    font = ImageFont.truetype(font_path, 24) if Path(font_path).exists() else ImageFont.load_default()
    draw.text((32, 24), 'MIANMIAN / 7 ACTIONS / 28 FRAMES', fill='#433752', font=font)
    for row, action in enumerate(ACTIONS):
        y = 80 + row * 274
        draw.text((24, y + 118), action, fill='#655271', font=font)
        for index in range(4):
            x = 150 + index * 256
            draw.rectangle((x, y, x + 253, y + 255), fill='#e6ecec')
            im = Image.open(ROOT / action / f'{action}-{index+1}.png')
            board.paste(im, (x, y), im)
    board.save(ROOT / 'all-actions-preview.png')
    archive = ROOT.parent / 'lilac-girl-20260831.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for path in sorted(ROOT.rglob('*')):
            if path.is_file() and 'rejected' not in path.name and path.name != 'prompt-v1.txt':
                z.write(path, Path(ROOT.name) / path.relative_to(ROOT))
    print(json.dumps({'status':'PASS', 'actions':7, 'frames':28, 'zip':str(archive),
                      'bytes':archive.stat().st_size}, ensure_ascii=False))

if __name__ == '__main__':
    build()
