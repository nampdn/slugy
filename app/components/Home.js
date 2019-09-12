// @flow
import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { ipcRenderer, remote } from 'electron';
import { makeStyles } from '@material-ui/core/styles';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import NavigationIcon from '@material-ui/icons/Navigation';
import CheckIcon from '@material-ui/icons/Check';
import CircularProgress from '@material-ui/core/CircularProgress';
import { green } from '@material-ui/core/colors';

import styles from './Home.css';

const useStyles = makeStyles(theme => ({
  wrapper: {
    margin: theme.spacing(2),
    position: 'relative',
    alignSelf: 'center'
  },
  fabProgress: {
    color: green[500],
    position: 'absolute',
    top: -5,
    left: -5,
    zIndex: 1
  },
  button: {
    margin: theme.spacing(1)
  },
  extendedIcon: {
    marginRight: theme.spacing(0)
  },
  container: {
    display: 'flex',
    flexDirection: 'column'
  },
  formControl: {
    margin: theme.spacing(1)
  },
  buttonSuccess: {
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[700]
    }
  }
}));

const Home = () => {
  const [version, setVersion] = useState('');
  const [path, setPath] = useState('?');
  const [status, setStatus] = useState('Chưa chọn đường dẫn');
  const [isWorking, setIsWorking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const classes = useStyles();

  const [capitalize, setCapitalize] = useState(false);
  const [removeSpace, setRemoveSpace] = useState(false);
  const [numberDash, setNumberDash] = useState(false);

  const buttonClassname = clsx({
    [classes.buttonSuccess]: isCompleted
  });

  useEffect(() => {
    // eslint:disable-next-line
    ipcRenderer.on('slugify-select-dir', (_, selectedPath) => {
      setPath(selectedPath);
      setIsWorking(false);
      setIsCompleted(false);
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
          setIsWorking(false);
          setIsCompleted(true);
          break;
        case 'error':
          setStatus(`Có lỗi xảy ra, kiểm tra lại thư mục!`);
          setIsWorking(false);
          break;
        default:
      }
    });
  }, []);

  useEffect(
    () => {
      const appVersion = remote.app.getVersion();
      setVersion(appVersion);
      if (path !== '?' && !isWorking && !isCompleted) {
        setStatus('Nhấn GO để bắt đầu!');
      }
      if (isCompleted) {
        setStatus('Hoàn Tất!');
      }
    },
    [path, isWorking, isCompleted]
  );

  function openDirectory() {
    ipcRenderer.send('load-dir');
  }

  function confirm() {
    if (path !== '?' && !isWorking) {
      ipcRenderer.send('slugify-dir', {
        path,
        capitalize,
        removeSpace,
        numberDash
      });
    }
  }

  const handleSwitch = which => () => {
    switch (which) {
      case 'capitalize':
        setCapitalize(!capitalize);
        break;
      case 'removespace':
        setRemoveSpace(!removeSpace);
        break;
      case 'numberdash':
        setNumberDash(!numberDash);
        break;
      default:
    }
  };

  return (
    <div className={styles.container} data-tid="container">
      <div className={styles.vertical} style={{ flex: 1, minHeight: 300 }}>
        <div className={styles.brand}>
          <h3>SLUGY</h3>
          <span className={styles.description}>
            Chương trình hỗ trợ xóa dấu tiếng Việt trong tên file hàng loạt.
          </span>
        </div>
        <div
          className={styles.vertical}
          style={{
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div style={{ margin: '5px' }}>
            <Button
              variant="contained"
              className={classes.button}
              onClick={openDirectory}
            >
              Chọn thư mục...
            </Button>
          </div>
          <span className={styles.path}>{path}</span>
          <div className={classes.container}>
            <FormControlLabel
              control={
                <Switch
                  checked={capitalize}
                  onChange={handleSwitch('capitalize')}
                />
              }
              label="In hoa chữ đầu"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={removeSpace}
                  onChange={handleSwitch('removespace')}
                />
              }
              label="Xóa Khoảng Cách"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={numberDash}
                  onChange={handleSwitch('numberdash')}
                />
              }
              label="Gạch Ngang Sau Số"
            />
          </div>
        </div>
        <span className={styles.version}>{status}</span>
        <div className={classes.wrapper}>
          <Fab
            onClick={confirm}
            disabled={isWorking || path === '?'}
            variant="extended"
            className={buttonClassname}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '28px'
            }}
          >
            {isCompleted ? <CheckIcon /> : <NavigationIcon />}
          </Fab>
          {isWorking && (
            <CircularProgress size={62} className={classes.fabProgress} />
          )}
        </div>
      </div>
      <span className={styles.version}>
        Phiên bản: {version} - Phát hành: 12/09/2019
      </span>
    </div>
  );
};

export default Home;
