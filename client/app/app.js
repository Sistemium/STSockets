'use strict';

angular.module('stsocketsApp', [
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
