// jsdom does not implement HTMLDialogElement.showModal()/close(); the Modal
// component relies on the native <dialog> API, so tests get a minimal polyfill.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.show = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement, returnValue?: string) {
    if (!this.open) {
      return;
    }
    this.open = false;
    if (returnValue !== undefined) {
      this.returnValue = returnValue;
    }
    this.dispatchEvent(new Event('close'));
  };
}
