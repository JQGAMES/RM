const CACHE_NAME =
  'rittermanager-v5';


const APP_SHELL = [

  './',

  './index.html',

  './styles.css?v=4',

  './app.js?v=5.0.0',

  './manifest.webmanifest?v=4',

  './assets/icon-192.png',

  './assets/icon-512.png',

  './assets/klausi.jpg'

];


self.addEventListener(

  'install',

  event => {

    event.waitUntil(

      caches
        .open(
          CACHE_NAME
        )
        .then(
          cache =>
            cache.addAll(
              APP_SHELL
            )
        )

    );


    self.skipWaiting();

  }

);


self.addEventListener(

  'activate',

  event => {

    event.waitUntil(

      caches
        .keys()
        .then(

          keys =>
            Promise.all(

              keys

                .filter(
                  key =>
                    key !==
                    CACHE_NAME
                )

                .map(
                  key =>
                    caches.delete(
                      key
                    )
                )

            )

        )

    );


    self.clients.claim();

  }

);


self.addEventListener(

  'fetch',

  event => {

    const request =
      event.request;


    const url =
      new URL(
        request.url
      );


    if(
      request.method !==
      'GET'
    ){
      return;
    }


    /*
      API niemals aus dem Cache.
    */

    if(
      url.hostname
        .endsWith(
          '.workers.dev'
        )
    ){
      return;
    }


    /*
      App-Dateien:
      Netzwerk zuerst.

      Dadurch wird bei GitHub Pages
      wirklich die neue Version geladen.
    */

    event.respondWith(

      fetch(
        request,
        {
          cache:
            'no-store'
        }
      )

        .then(

          response => {

            if(
              response &&
              response.ok
            ){

              const copy =
                response.clone();


              caches
                .open(
                  CACHE_NAME
                )
                .then(

                  cache =>
                    cache.put(
                      request,
                      copy
                    )

                );

            }


            return response;

          }

        )

        .catch(

          () =>
            caches.match(
              request
            )

        )

    );

  }

);
