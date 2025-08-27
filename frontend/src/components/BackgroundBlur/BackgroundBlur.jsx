import React from 'react';
import './BackgroundBlur.css';

const BackgroundBlur = ({ pageName }) => {
  return (
    <div
      className="background-blur"
      data-page={pageName}
    ></div>
  );
};

export default BackgroundBlur;
