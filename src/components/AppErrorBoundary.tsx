import { Component, type ReactNode } from 'react';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="mx-auto max-w-lg p-6 pt-16"><section className="card"><h1 className="text-lg font-semibold">页面暂时无法打开</h1><p className="my-4 text-sm leading-7 text-slate-500">已保存的本地记录不会被清除。可尝试刷新页面；如果仍无法打开，请保留浏览器数据以便排查。</p><button type="button" className="primary-button" onClick={() => window.location.reload()}>重新打开</button></section></main>;
    return this.props.children;
  }
}
