'use strict';

angular.module('stsocketsApp', [
    'btford.socket-io',
    'ui.router',
    'sistemium',
    'sistemiumBootstrap'
  ])
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider
      .otherwise('/');
  })

  .run(['$rootScope', function ($rootScope) {
      $rootScope.$on('$stateChangeStart', function () {

      });
    }]
  )
;
