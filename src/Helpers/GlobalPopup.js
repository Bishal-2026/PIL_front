import { createPortal } from "react-dom";
import { useEffect } from "react";

const GlobalPopup = ({ isVisible, onClose, children }) => {
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return createPortal(
    <div className="modal-overlay z-[10000]">
      <div className="modal-wrapper">
        <button
          className="modal-close-btn"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="modal-container !max-w-xl">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GlobalPopup;
