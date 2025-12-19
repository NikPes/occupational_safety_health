import React, { useState } from 'react';
import AddRowFunc from '@/components/ComTable/subcomponents/AddRowFunc/AddRowFunc.jsx';
import './AddButton.css';

const AddButton = ({ token, table_name, onDataUpdated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className="addButton"
        onClick={() => setIsModalOpen(true)}
      >
        Добавить
      </button>

      <AddRowFunc
        token={token}
        table_name={table_name}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          onDataUpdated?.();
        }}
      />
    </>
  );
};

export default AddButton;