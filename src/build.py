# 使い方: このフォルダで  python3 build.py  → 一つ上のフォルダに index.html と manifest.webmanifest を作ります
import json,base64,re,os
here=os.path.dirname(os.path.abspath(__file__))
P=lambda f:os.path.join(here,f)
cfg=json.load(open(P('config.json'),encoding='utf8'))
d=json.load(open(P('icons.json'),encoding='utf8'))
d2=json.load(open(P('icons2.json'),encoding='utf8'))
def clean(svg):
    svg=re.sub(r'<defs>.*?</defs>','',svg,flags=re.S)
    svg=re.sub(r' clip-path="url\(#[^)]*\)"','',svg)
    svg=re.sub(r'<mask id="mask0[^>]*>.*?</mask>','',svg,flags=re.S)
    svg=re.sub(r' mask="url\(#[^)]*\)"','',svg)
    svg=re.sub(r'<g filter="[^"]*">\s*</g>','',svg)
    svg=re.sub(r' filter="url\(#[^)]*\)"','',svg)
    svg=re.sub(r'\n\s*\n+','\n',svg)
    return svg
def datauri(svg):
    return 'data:image/svg+xml;base64,'+base64.b64encode(svg.encode('utf8')).decode()
for k,v in d2.items():
    svg=clean(v['svg']); w=round(v['w'],1); h=round(v['h'],1)
    if k=='tab_cards':
        d['tab_cards_on']={'s':datauri(svg),'w':w,'h':h}
        d['tab_cards_off']={'s':datauri(svg.replace('#E55C00','#A39FAB').replace('#FFF0EA','#FFFFFF')),'w':w,'h':h}
    elif k=='tab_cal':
        d['tab_cal_off']={'s':datauri(svg),'w':w,'h':h}
        d['tab_cal_on']={'s':datauri(svg.replace('#A39FAB','#E55C00')),'w':w,'h':h}
    else:
        d[k]={'s':datauri(svg),'w':w,'h':h}
icons=json.dumps(d,ensure_ascii=False,separators=(',',':'))
css=open(P('base.css'),encoding='utf8').read()+'\n'+open(P('new.css'),encoding='utf8').read()
js=open(P('app.js'),encoding='utf8').read().replace('__ICONS__',icons).replace('__APP_NAME__',cfg['name'].replace("'","\\'"))
html='''<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>'''+cfg['name']+'''</title>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="'''+cfg['short_name']+'''">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="'''+cfg['theme_color']+'''">
<meta name="robots" content="noindex,nofollow">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap">
<style>
'''+css+'''
</style></head><body>
<div id="app"></div>
<div id="layer"></div>
<script>
'''+js+'''
</script>
</body></html>
'''
open(os.path.join(here,'..','index.html'),'w',encoding='utf8').write(html)
man={"name":cfg['name'],"short_name":cfg['short_name'],"start_url":"./","scope":"./","display":"standalone","orientation":"portrait","background_color":cfg['background_color'],"theme_color":cfg['theme_color'],"lang":"ja","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"}]}
json.dump(man,open(os.path.join(here,'..','manifest.webmanifest'),'w',encoding='utf8'),ensure_ascii=False,indent=2)
print('built',len(html))
