import { useState, useEffect } from 'react';
import { basename } from '@tauri-apps/api/path';
import { exists, readTextFile } from '@tauri-apps/api/fs';
import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window'
import { listen } from '@tauri-apps/api/event';
import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import MarkdownItExternalLinks from 'markdown-it-external-links';
import './App.css';

const md = new MarkdownIt();
md.use(MarkdownItAnchor);
md.use(MarkdownItExternalLinks, { externalTarget: '_blank' });

let initialed = false;
let _HTML = '';

function App() {
  const [HTML, setHTML] = useState(_HTML);
  const [dropHover, setDropHover] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    invoke<string>('if_file_handling', {}).then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        const path = data[0];

        openFileByPath(path);
      }
    });

    if (initialed === true) {
      return;
    }
    initialed = true;

    const fileDropHoverListener = listen<string[]>('tauri://file-drop-hover', ({ payload }) => {
      const path = payload[0].trim();

      if (isMDPath(path) === false) {
        setDropHover('File not supported');
        return;
      }

      setDropHover(`Load file ${path}`);
    });

    const fileDropListener = listen<string[]>('tauri://file-drop', ({ payload }) => {
      const path = payload[0];

      openFileByPath(path);
      setDropHover('');
    });

    const fileDropCancaledListener = listen('tauri://file-drop-cancelled', () => {
      setDropHover('');
    });

    appWindow.theme().then(console.info);
    const themeChangedListener = appWindow.onThemeChanged(({ payload: theme }) => {
      console.info(theme);
    });

    return () => {
      initialed = false;

      fileDropHoverListener.then(unlisted => unlisted());
      fileDropListener.then(unlisted => unlisted());
      fileDropCancaledListener.then(unlisted => unlisted());
      themeChangedListener.then(unlisted => unlisted());
    }
  }, []);

  useEffect(() => {
    if (!!fileName) {
      appWindow.setTitle(`${fileName}`);
    }
  }, [fileName]);

  async function openFileByPath(path: string) {
    try {
      console.info('openFileByPath called with', path);

      if (!path) {
        throw new Error();
      }

      if (isMDPath(path) === false) {
        throw new Error(`File ${path} type not supported`);
      }

      if ((await exists(path)) === false) {
        throw new Error(`File ${path} is unaccessable`);
      }

      const _markdown = await readTextFile(path);

      renderMDToHTML(_markdown);

      setFileName(await basename(path));
    } catch (error: any) {
      console.error(error);

      if (error?.message?.length) {
        setDropHover(error?.message);
      }
    }
  }

  function renderMDToHTML(_markdown: string) {
    const HTML = md.render(_markdown);

    setHTML(HTML);
    _HTML = HTML;
  }

  function isMDPath(path: string) {
    return path.substring(path.length - 3) === '.md'
  }

  return (
    <div className="App" onClick={() => setDropHover("")}>
      <div
        className={dropHover === "" ? "App__DropHover" : "App__DropHover App__DropHover--showing"}
      >{dropHover}</div>

      <div className="App__rendered markdown-body" dangerouslySetInnerHTML={{ __html: HTML }}></div>
    </div>
  );
}

export default App;
