const CACHE =
  'rittermanager-v9';


const ASSETS = [

  './',

  './index.html',

  './styles.css?v=9.0.0',

  './app.js?v=9.0.0',

  './manifest.webmanifest?v=4',

  './assets/klausi.jpg',

  './assets/icon-192.png',

  './assets/icon-512.png'

];


self.addEventListener(
  'install',
  event => {

    self.skipWaiting();


    event.waitUntil(

      caches
        .open(
          CACHE
        )
        .then(
          cache =>
            cache.addAll(
              ASSETS
            )
        )
    );
  }
);


self.addEventListener(
  'activate',
  event => {

    event.waitUntil(
      (
        async () => {

          for(
            const key
            of await caches.keys()
          ){

            if(
              key !==
              CACHE
            ){

              await caches.delete(
                key
              );
            }
          }


          await self.clients.claim();

        }
      )()
    );
  }
);


self.addEventListener(
  'fetch',
  event => {

    if(
      event.request.method
      !==
      'GET'
    ){
      return;
    }


    const url =
      new URL(
        event.request.url
      );


    if(
      url.hostname
        .endsWith(
          '.workers.dev'
        )
    ){
      return;
    }


    event.respondWith(

      fetch(
        event.request,
        {
          cache:
            'no-store'
        }
      )

      .then(
        response => {

          if(
            response.ok
          ){

            caches
              .open(
                CACHE
              )
              .then(
                cache =>
                  cache.put(
                    event.request,
                    response.clone()
                  )
              );
          }


          return response;
        }
      )

      .catch(
        () =>
          caches.match(
            event.request
          )
      )
    );
  }
);
