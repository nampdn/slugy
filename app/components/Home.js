// @flow
import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import styles from './Home.css';

const Home = () => {
  const [path, setPath] = useState('?');
  const [status, setStatus] = useState('Chưa chọn đường dẫn');
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    // eslint:disable-next-line
    ipcRenderer.on('slugify-select-dir', (_, selectedPath) => {
      setPath(selectedPath);
      setIsWorking(false);
    });

    ipcRenderer.on('slugify-progress', (_, state) => {
      switch (state) {
        case 'loading':
          setStatus('Đang xử lý...');
          setIsWorking(true);
          break;
        case 'loading-move':
          setStatus('Đang đổi tên...');
          break;
        case 'loading-clean':
          setStatus('Đang dọn dẹp...');
          break;
        case 'success':
          setStatus('Hoàn Tất');
          setIsWorking(false);
          break;
        case 'error':
          setStatus(`Lỗi!`);
          setIsWorking(false);
          break;
        default:
      }
    });
  }, []);

  useEffect(
    () => {
      if (path !== '?' && !isWorking) {
        setStatus('Nhấn OK để bắt đầu!');
      }
    },
    [path, isWorking]
  );

  function openDirectory() {
    ipcRenderer.send('load-dir');
  }

  function confirm() {
    if (path !== '?' && !isWorking) {
      ipcRenderer.send('slugify-dir', path);
    }
  }

  return (
    <div className={styles.container} data-tid="container">
      <div
        className={styles.vertical}
        style={{ flex: 1, maxHeight: 500, minHeight: 300 }}
      >
        <div className={styles.brand}>
          <h3>SLUGY</h3>
          <span className={styles.description}>
            Chương trình hỗ trợ xóa dấu tiếng Việt trong tên file hàng loạt.
          </span>
        </div>
        <div
          className={styles.vertical}
          style={{
            margin: '20px 0 20px 0',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <button
            className={styles.button}
            style={{ maxWidth: 100, margin: '20px' }}
            type="button"
            onClick={openDirectory}
          >
            Chọn thư mục...
          </button>
          <span className={styles.path}>{path}</span>
        </div>
        <span className={styles.version}>{status}</span>
        <button
          onClick={confirm}
          className={styles.confirmButton}
          type="button"
          disabled={isWorking}
        >
          GO!
        </button>
      </div>
      <span className={styles.version}>
        Phiên bản: 1.0.0 - Phát hành: 11/09/2019
      </span>
    </div>
  );
};

export default Home;
