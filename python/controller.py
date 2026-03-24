import os
import base64
import time
import subprocess
from io import BytesIO

from flask import Flask, request, jsonify
from flask_cors import CORS

try:
  import pyautogui
except Exception:
  pyautogui = None

try:
  import psutil
except Exception:
  psutil = None

app = Flask(__name__)
CORS(app)

MAYA_TOKEN = os.getenv('MAYA_AGENT_TOKEN', 'maya_local_token')


def check_token(req):
  token = req.headers.get('X-MAYA-TOKEN') or req.args.get('token')
  return token == MAYA_TOKEN


@app.route('/health', methods=['GET'])
def health():
  return jsonify({'success': True, 'status': 'ok'})


# ── KEYBOARD ──────────────────────────────────────────
@app.route('/keyboard/type', methods=['POST'])
def keyboard_type():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  text = request.json.get('text', '')
  try:
    if pyautogui:
      pyautogui.typewrite(text)
    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/keyboard/hotkey', methods=['POST'])
def keyboard_hotkey():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  keys = request.json.get('keys', [])
  try:
    if pyautogui and keys:
      pyautogui.hotkey(*keys)
    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/keyboard/press', methods=['POST'])
def keyboard_press():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  key = request.json.get('key', '')
  try:
    if pyautogui and key:
      pyautogui.press(key)
    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


# ── MOUSE ─────────────────────────────────────────────
@app.route('/mouse/click', methods=['POST'])
def mouse_click():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  data = request.json or {}
  x = data.get('x')
  y = data.get('y')
  try:
    if pyautogui:
      if x is not None and y is not None:
        pyautogui.click(x, y)
      else:
        pyautogui.click()
    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/mouse/move', methods=['POST'])
def mouse_move():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  data = request.json or {}
  x = data.get('x')
  y = data.get('y')
  try:
    if pyautogui and x is not None and y is not None:
      pyautogui.moveTo(x, y, duration=0.15)
    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/mouse/scroll', methods=['POST'])
def mouse_scroll():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  clicks = int(request.json.get('clicks', 0))
  try:
    if pyautogui:
      pyautogui.scroll(clicks)
    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


# ── SCREENSHOT ────────────────────────────────────────
@app.route('/screenshot', methods=['GET'])
def screenshot():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  try:
    if not pyautogui:
      return jsonify({'success': False, 'error': 'pyautogui missing'})
    image = pyautogui.screenshot()
    buf = BytesIO()
    image.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode()
    return jsonify({'success': True, 'image': b64})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


# ── APPS / WEB ────────────────────────────────────────
@app.route('/app/open', methods=['POST'])
def app_open():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  app_name = request.json.get('app', '')
  try:
    if os.name == 'nt':
      subprocess.Popen(app_name, shell=True)
    else:
      subprocess.Popen(['open', app_name])
    return jsonify({'success': True, 'opened': app_name})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/web/search', methods=['POST'])
def web_search():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  query = request.json.get('query', '')
  platform = request.json.get('platform', 'google')
  try:
    import webbrowser
    url = f'https://www.google.com/search?q={query}'
    if platform.lower() == 'youtube':
      url = f'https://www.youtube.com/results?search_query={query}'
    webbrowser.open(url)
    return jsonify({'success': True, 'opened': url})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/web/smart-search', methods=['POST'])
def web_smart_search():
  return web_search()


@app.route('/web/youtube-search', methods=['POST'])
def youtube_search_keyboard():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401

  import subprocess
  import time

  query = request.json.get('query', '')
  if not query:
    return jsonify({'success': False, 'error': 'No query'})

  encoded = query.replace(' ', '+')
  url = f'https://www.youtube.com/results?search_query={encoded}'

  try:
    subprocess.Popen(f'start chrome \"{url}\"', shell=True)
    time.sleep(2)
    return jsonify({
      'success': True,
      'query': query,
      'url': url,
      'method': 'direct_url'
    })
  except Exception:
    try:
      subprocess.Popen(f'start \"{url}\"', shell=True)
      return jsonify({'success': True, 'method': 'default_browser'})
    except Exception as e2:
      return jsonify({'success': False, 'error': str(e2)})


@app.route('/web/google-search', methods=['POST'])
def google_search_keyboard():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401

  import subprocess

  query = request.json.get('query', '')
  encoded = query.replace(' ', '+')
  url = f'https://www.google.com/search?q={encoded}'

  try:
    subprocess.Popen(f'start chrome \"{url}\"', shell=True)
    return jsonify({'success': True, 'url': url})
  except Exception:
    subprocess.Popen(f'start \"{url}\"', shell=True)
    return jsonify({'success': True, 'method': 'fallback'})


@app.route('/web/open-site', methods=['POST'])
def open_site():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401

  import subprocess

  site = request.json.get('site', '')
  sites = {
    'youtube':    'https://youtube.com',
    'google':     'https://google.com',
    'gmail':      'https://mail.google.com',
    'instagram':  'https://instagram.com',
    'twitter':    'https://twitter.com',
    'github':     'https://github.com',
    'netflix':    'https://netflix.com',
    'spotify':    'https://open.spotify.com',
    'whatsapp':   'https://web.whatsapp.com',
    'linkedin':   'https://linkedin.com',
    'reddit':     'https://reddit.com',
    'amazon':     'https://amazon.in',
    'flipkart':   'https://flipkart.com',
  }
  url = sites.get(site.lower(), f'https://{site}')
  subprocess.Popen(f'start chrome \"{url}\"', shell=True)
  return jsonify({'success': True, 'url': url})


# ── SYSTEM ────────────────────────────────────────────
@app.route('/system/volume', methods=['POST'])
def system_volume():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  action = request.json.get('action')
  try:
    if pyautogui and action:
      mapping = {
        'up': 'volumeup',
        'down': 'volumedown',
        'mute': 'volumemute'
      }
      key = mapping.get(action)
      if key:
        pyautogui.press(key)
    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/system/info', methods=['GET'])
def system_info():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  try:
    cpu = psutil.cpu_percent(interval=0.5) if psutil else 0
    ram = psutil.virtual_memory().percent if psutil else 0
    return jsonify({'success': True, 'cpu': cpu, 'ram': ram})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


# ── ACTION SEQUENCE ───────────────────────────────────
@app.route('/action/sequence', methods=['POST'])
def action_sequence():
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  actions = request.json.get('actions', [])
  results = []
  for act in actions:
    atype = act.get('type')
    try:
      if atype == 'type':
        keyboard_type()
      elif atype == 'hotkey':
        keyboard_hotkey()
      elif atype == 'press':
        keyboard_press()
      elif atype == 'click':
        mouse_click()
      elif atype == 'move':
        mouse_move()
      elif atype == 'scroll':
        mouse_scroll()
      results.append({'type': atype, 'success': True})
    except Exception as e:
      results.append({'type': atype, 'success': False, 'error': str(e)})
  return jsonify({'success': True, 'results': results})


# ── BROWSER AUTOMATION WITH PLAYWRIGHT ───────────────
browser_instance = None
page_instance = None
pw_instance = None


def ensure_playwright():
  global pw_instance
  if pw_instance is None:
    from playwright.sync_api import sync_playwright
    pw_instance = sync_playwright().start()
  return pw_instance


@app.route('/browser/init', methods=['POST'])
def browser_init():
  global browser_instance, page_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  try:
    pw = ensure_playwright()
    browser_instance = pw.chromium.launch(
        headless=False,
        args=['--start-maximized']
    )
    context = browser_instance.new_context(
        viewport={'width': 1920, 'height': 1080}
    )
    page_instance = context.new_page()
    return jsonify({'success': True, 'message': 'Browser ready'})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/browser/goto', methods=['POST'])
def browser_goto():
  global page_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  url = request.json.get('url', '')
  try:
    if not page_instance:
      browser_init()
    page_instance.goto(url, wait_until='domcontentloaded', timeout=15000)
    return jsonify({
        'success': True,
        'title': page_instance.title(),
        'url': page_instance.url
    })
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/browser/search-youtube', methods=['POST'])
def search_youtube():
  global page_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  query = request.json.get('query', '')
  try:
    if not page_instance:
      browser_init()
    page_instance.goto('https://www.youtube.com',
                       wait_until='domcontentloaded')
    time.sleep(1)
    page_instance.click('input#search')
    time.sleep(0.3)
    page_instance.fill('input#search', query)
    time.sleep(0.3)
    page_instance.press('input#search', 'Enter')
    time.sleep(2)
    results = page_instance.eval_on_selector_all(
        'ytd-video-renderer #video-title',
        'els => els.slice(0,5).map(e => ({title: e.innerText, href: e.href}))'
    )
    return jsonify({
        'success': True,
        'query': query,
        'results': results
    })
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/browser/click-youtube-result', methods=['POST'])
def click_youtube_result():
  global page_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  index = request.json.get('index', 0)
  try:
    results = page_instance.query_selector_all(
        'ytd-video-renderer #video-title'
    )
    if results and len(results) > index:
      results[index].click()
      time.sleep(2)
      return jsonify({
          'success': True,
          'title': page_instance.title()
      })
    return jsonify({'success': False, 'error': 'No results found'})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/browser/google-search', methods=['POST'])
def google_search():
  global page_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  query = request.json.get('query', '')
  try:
    if not page_instance:
      browser_init()
    url = f'https://www.google.com/search?q={query.replace(\" \", \"+\")}'
    page_instance.goto(url, wait_until='domcontentloaded')
    time.sleep(1)
    results = page_instance.eval_on_selector_all(
        'h3',
        'els => els.slice(0,5).map(e => e.innerText)'
    )
    return jsonify({
        'success': True,
        'query': query,
        'results': results
    })
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/browser/click', methods=['POST'])
def browser_click():
  global page_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  data = request.json
  try:
    selector = data.get('selector')
    x = data.get('x')
    y = data.get('y')
    if selector:
      page_instance.click(selector)
    elif x is not None and y is not None:
      page_instance.mouse.click(x, y)
    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/browser/type', methods=['POST'])
def browser_type():
  global page_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  data = request.json
  selector = data.get('selector', '')
  text = data.get('text', '')
  try:
    if selector:
      page_instance.fill(selector, text)
    else:
      page_instance.keyboard.type(text)
    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/browser/get-text', methods=['POST'])
def browser_get_text():
  global page_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  selector = request.json.get('selector', 'body')
  try:
    text = page_instance.inner_text(selector)
    return jsonify({'success': True, 'text': text[:5000]})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/browser/screenshot', methods=['GET'])
def browser_screenshot():
  global page_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  try:
    screenshot_bytes = page_instance.screenshot(type='jpeg', quality=70)
    b64 = base64.b64encode(screenshot_bytes).decode()
    return jsonify({'success': True, 'image': b64})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/browser/smart-action', methods=['POST'])
def browser_smart_action():
  global page_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  data = request.json
  action = data.get('action', '').lower()
  value = data.get('value', '')

  try:
    if not page_instance:
      return jsonify({'success': False, 'error': 'No browser open'})

    current_url = page_instance.url

    if 'youtube.com' in current_url:
      if action == 'search':
        page_instance.fill('input#search', value)
        page_instance.press('input#search', 'Enter')
        time.sleep(2)
        results = page_instance.eval_on_selector_all(
            'ytd-video-renderer #video-title',
            'els => els.slice(0,3).map(e => e.innerText)'
        )
        return jsonify({'success': True, 'results': results})

      elif action == 'play_first':
        page_instance.click('ytd-video-renderer #video-title')
        time.sleep(2)
        return jsonify({
            'success': True,
            'playing': page_instance.title()
        })

      elif action == 'pause':
        page_instance.keyboard.press('k')
        return jsonify({'success': True})

      elif action == 'fullscreen':
        page_instance.keyboard.press('f')
        return jsonify({'success': True})

      elif action == 'volume_up':
        for _ in range(3):
          page_instance.keyboard.press('ArrowUp')
        return jsonify({'success': True})

    elif 'google.com' in current_url:
      if action == 'search':
        page_instance.fill('textarea[name=\"q\"]', value)
        page_instance.press('textarea[name=\"q\"]', 'Enter')
        time.sleep(1)
        return jsonify({'success': True})

      elif action == 'click_first':
        page_instance.click('h3')
        time.sleep(1)
        return jsonify({'success': True})

    if action == 'scroll_down':
      page_instance.keyboard.press('PageDown')
      return jsonify({'success': True})

    elif action == 'scroll_up':
      page_instance.keyboard.press('PageUp')
      return jsonify({'success': True})

    elif action == 'back':
      page_instance.go_back()
      return jsonify({'success': True})

    elif action == 'refresh':
      page_instance.reload()
      return jsonify({'success': True})

    return jsonify({'success': False, 'error': f'Unknown action: {action}'})

  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


@app.route('/browser/close', methods=['POST'])
def browser_close():
  global browser_instance, page_instance, pw_instance
  if not check_token(request):
    return jsonify({'error': 'unauth'}), 401
  try:
    if browser_instance:
      browser_instance.close()
      browser_instance = None
      page_instance = None
    if pw_instance:
      pw_instance.stop()
      pw_instance = None
    return jsonify({'success': True})
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)})


if __name__ == '__main__':
  port = int(os.getenv('PORT', '5002'))
  app.run(host='0.0.0.0', port=port, debug=False)
