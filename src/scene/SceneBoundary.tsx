import { Component, type ReactNode } from 'react';

interface Props {
  /** Changing this clears a previous error (new lesson, or a retry). */
  resetKey: string;
  fallback: ReactNode;
  children: ReactNode;
}

/** Keeps a crashing scene from taking the lesson text and navigation down with it. */
export class SceneBoundary extends Component<Props, { failedKey: string | null }> {
  state = { failedKey: null as string | null };

  static getDerivedStateFromProps(props: Props, state: { failedKey: string | null }) {
    return state.failedKey !== null && state.failedKey !== props.resetKey ? { failedKey: null } : null;
  }

  componentDidCatch(error: unknown) {
    console.warn('Scene failed to render', error);
    this.setState({ failedKey: this.props.resetKey });
  }

  render() {
    return this.state.failedKey === null ? this.props.children : this.props.fallback;
  }
}
