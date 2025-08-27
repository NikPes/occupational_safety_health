import React from 'react';
import './EditDelButtons.css';

const EditDelButtons = ({ access_type, onEdit, onDelete }) => {
    return (
        <div className="edit-del-buttons">
            {(access_type === 'Edit access' || access_type === 'Full access') && (
                <button
                    className="edit-btn"
                    onClick={onEdit}
                    title="Edit"
                >
                    <span className="icon-edit">edit</span>
                </button>
            )}
            {access_type === 'Full access' && (
                <button
                    className="delete-btn"
                    onClick={onDelete}
                    title="Delete"
                >
                    <span className="icon-delete">delete</span>
                </button>
            )}
        </div>
    );
};

export default EditDelButtons;