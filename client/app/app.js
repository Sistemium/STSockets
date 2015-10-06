'use strict';

angular.module('stsocketsApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
  })
  .run(['$rootScope', 'socket', function ($rootScope, socket) {
    $rootScope.$on('$stateChangeStart',  function (event, next, nextParams) {
      var status = {};
      socket.socket.emit('status:change', status);
    })
  }]);
