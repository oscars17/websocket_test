import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

export default class ToastifyHandler {
  private messageText: string;
  private messageStatus: string;
  private colorsSheet: Record<string, string> = {
    error: "red",
    success: "green",
    info: "blue",
  };

  constructor(message: string, subject: string) {
    this.messageText = message;
    this.messageStatus = subject;
  }

  public showToast() {
    Toastify({
      text: this.messageText,
      style: {
        background: this.colorsSheet[this.messageStatus] || "blue",
      },
    }).showToast();
  }
}
