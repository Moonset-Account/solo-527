import React from 'react';
import logo from '../public/images/logo.svg';
import './styles.css';

const App: React.FC = () => {
  const [image, setImage] = React.useState('used.png');

  const dynamicImage = require(`../public/images/${image}`);

  return (
    <div className="app">
      <img src={logo} alt="Logo" />
      <img src="../public/images/used.png" alt="Used" />
      <img src={dynamicImage} alt="Dynamic" />
    </div>
  );
};

export default App;
