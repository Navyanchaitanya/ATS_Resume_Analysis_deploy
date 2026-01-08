'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'is_admin', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    
    await queryInterface.addColumn('Users', 'admin_role', {
      type: Sequelize.STRING,
      defaultValue: 'user'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'is_admin');
    await queryInterface.removeColumn('Users', 'admin_role');
  }
};