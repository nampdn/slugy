// @flow
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <h2>Đổi Tên File Chuẩn</h2>
        <button
          type="button"
          onClick={() => {
            ipcRenderer.sendSync('load-dir');
          }}
        >
          Chọn Thư Mục
        </button>
      </div>
    );
  }
}
