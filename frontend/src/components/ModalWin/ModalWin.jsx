import React, { useEffect } from 'react';
import './ModalWin.css';

const ModalWin = ({
  title,
  children,
  isOpen,
  onClose,
  onAction,       // Универсальный обработчик действия
  actionStyle = 'blue', // Стиль кнопки: 'blue', 'green', 'red'
  actionText = 'Подтвердить', // Текст кнопки
  isLoading = false,
  loadingText = 'Загрузка...', // Текст при загрузке
  error = null
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isLoading && onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`prefix-Dialog ${isOpen ? 'active' : ''}`}>
      <div>
        <a href="#close" className="prefix-close" onClick={handleClose}></a>
        <h2>{title}</h2>
        <div className="prefix-tabs table_modal">
          {children}
          {error && <div className="error-message">{error}</div>}
        </div>
        <div className="modal-footer">
          <button
            className={`action-button ${actionStyle}`}
            onClick={(e) => {
              e.preventDefault();
              onAction?.();
            }}
            disabled={isLoading}
          >
            {isLoading ? loadingText : actionText}
          </button>
          <button
            className="cancel"
            onClick={handleClose}
            disabled={isLoading}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalWin;


// import React, { useEffect } from 'react';
// import './ModalWin.css';
//
// const ModalWin = ({
//                     title,
//                     children,
//                     isOpen,
//                     onClose,
//                     onSave,
//                     onTrain,
//                     mode = 'add',
//                     isLoading = false,
//                     error = null
//                   }) => {
//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = 'hidden';
//       document.body.classList.add('modal-open');
//     } else {
//       document.body.style.overflow = 'auto';
//       document.body.classList.remove('modal-open');
//     }
//
//     return () => {
//       document.body.style.overflow = 'auto';
//       document.body.classList.remove('modal-open');
//     };
//   }, [isOpen]);
//
//   const handleClose = () => {
//     if (!isLoading && onClose) onClose();
//   };
//
//   if (!isOpen) return null;
//
//   return (
//     <div className={`prefix-Dialog ${isOpen ? 'active' : ''}`}>
//       <div>
//         <a href="#close" className="prefix-close" onClick={handleClose}></a>
//         <h2>{title}</h2>
//         <div className="prefix-tabs table_modal">
//           {children}
//           {error && <div className="error-message">{error}</div>}
//         </div>
//         <div className="modal-footer">
//           <button
//             className="submit"
//             onClick={(e) => {
//               e.preventDefault();
//               onSave();
//             }}
//             disabled={isLoading}
//           >
//             {isLoading
//               ? (mode === 'edit' ? 'Сохранение...' : 'Добавление...')
//               : (mode === 'edit' ? 'Сохранить' : 'Добавить')}
//           </button>
//           <button
//             className="cancel"
//             onClick={handleClose}
//             disabled={isLoading}
//           >
//             Отмена
//
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };
//
// export default ModalWin;