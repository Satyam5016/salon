import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-ivory px-4">
          <section className="max-w-lg rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-neutral-200">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blush">Something went wrong</p>
            <h1 className="mt-3 text-3xl font-bold text-ink">We could not load this view.</h1>
            <p className="mt-3 text-neutral-600">Refresh the page, or return to the salon home screen.</p>
            <a className="mt-6 inline-flex min-h-11 items-center rounded-md bg-ink px-5 text-sm font-bold text-white" href="/">
              Go Home
            </a>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
