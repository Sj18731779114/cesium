import {
  Math as CesiumMath,
  Rectangle,
  Request,
  RequestScheduler,
  Resource,
  WebMercatorTilingScheme,
  OpenStreetMapImageryProvider,
  Imagery,
  ImageryLayer,
  ImageryState,
  UrlTemplateImageryProvider,
} from "../../index.js";

import pollToPromise from "../../../../Specs/pollToPromise.js";

describe("Scene/OpenStreetMapImageryProvider", function () {
  beforeEach(function () {
    RequestScheduler.clearForSpecs();
  });

  afterEach(function () {
    Resource._Implementations.createImage =
      Resource._DefaultImplementations.createImage;
  });

  it("return a UrlTemplateImageryProvider", function () {
    const provider = new OpenStreetMapImageryProvider();
    expect(provider).toBeInstanceOf(UrlTemplateImageryProvider);
  });

  it("returns valid value for hasAlphaChannel", function () {
    const provider = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server/",
    });

    expect(typeof provider.hasAlphaChannel).toBe("boolean");
  });

  it("supports a Resource for the url", function () {
    const resource = new Resource({
      url: "made/up/osm/server/",
    });

    const provider = new OpenStreetMapImageryProvider({
      url: resource,
    });

    spyOn(Resource._Implementations, "createImage").and.callFake(
      function (request, crossOrigin, deferred) {
        expect(request.url).not.toContain("//");

        // Just return any old image.
        Resource._DefaultImplementations.createImage(
          new Request({ url: "Data/Images/Red16x16.png" }),
          crossOrigin,
          deferred,
        );
      },
    );

    return provider.requestImage(0, 0, 0).then(function (image) {
      expect(Resource._Implementations.createImage).toHaveBeenCalled();
      expect(image).toBeImageOrImageBitmap();
    });
  });

  it("supports a slash at the end of the URL", function () {
    const provider = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server/",
    });

    spyOn(Resource._Implementations, "createImage").and.callFake(
      function (request, crossOrigin, deferred) {
        expect(request.url).not.toContain("//");

        // Just return any old image.
        Resource._DefaultImplementations.createImage(
          new Request({ url: "Data/Images/Red16x16.png" }),
          crossOrigin,
          deferred,
        );
      },
    );

    return provider.requestImage(0, 0, 0).then(function (image) {
      expect(Resource._Implementations.createImage).toHaveBeenCalled();
      expect(image).toBeImageOrImageBitmap();
    });
  });

  it("supports no slash at the endof the URL", function () {
    const provider = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server",
    });

    spyOn(Resource._Implementations, "createImage").and.callFake(
      function (request, crossOrigin, deferred) {
        expect(request.url).toContain("made/up/osm/server/");

        // Just return any old image.
        Resource._DefaultImplementations.createImage(
          new Request({ url: "Data/Images/Red16x16.png" }),
          crossOrigin,
          deferred,
        );
      },
    );

    return provider.requestImage(0, 0, 0).then(function (image) {
      expect(Resource._Implementations.createImage).toHaveBeenCalled();
      expect(image).toBeImageOrImageBitmap();
    });
  });

  it("requestImage returns a promise for an image and loads it for cross-origin use", function () {
    const provider = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server/",
    });

    expect(provider.url).toContain("made/up/osm/server/");
    expect(provider.tileWidth).toEqual(256);
    expect(provider.tileHeight).toEqual(256);
    expect(provider.maximumLevel).toBeUndefined();
    expect(provider.tilingScheme).toBeInstanceOf(WebMercatorTilingScheme);
    expect(provider.rectangle).toEqual(new WebMercatorTilingScheme().rectangle);

    spyOn(Resource._Implementations, "createImage").and.callFake(
      function (request, crossOrigin, deferred) {
        // Just return any old image.
        Resource._DefaultImplementations.createImage(
          new Request({ url: "Data/Images/Red16x16.png" }),
          crossOrigin,
          deferred,
        );
      },
    );

    return provider.requestImage(0, 0, 0).then(function (image) {
      expect(Resource._Implementations.createImage).toHaveBeenCalled();
      expect(image).toBeImageOrImageBitmap();
    });
  });

  it("when no credit is supplied, a default one is used", function () {
    const provider = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server",
    });
    expect(provider.credit).toBeDefined();
  });

  it("turns the supplied credit into a logo", function () {
    const providerWithCredit = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server",
      credit: "Thanks to our awesome made up source of this imagery!",
    });
    expect(providerWithCredit.credit).toBeDefined();
  });

  it("rectangle passed to constructor does not affect tile numbering", function () {
    const rectangle = new Rectangle(0.1, 0.2, 0.3, 0.4);
    const provider = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server",
      rectangle: rectangle,
    });

    expect(provider.tileWidth).toEqual(256);
    expect(provider.tileHeight).toEqual(256);
    expect(provider.maximumLevel).toBeUndefined();
    expect(provider.tilingScheme).toBeInstanceOf(WebMercatorTilingScheme);
    expect(provider.rectangle.west).toEqualEpsilon(
      rectangle.west,
      CesiumMath.EPSILON10,
    );
    expect(provider.rectangle.south).toEqualEpsilon(
      rectangle.south,
      CesiumMath.EPSILON10,
    );
    expect(provider.rectangle.east).toEqualEpsilon(
      rectangle.east,
      CesiumMath.EPSILON10,
    );
    expect(provider.rectangle.north).toEqualEpsilon(
      rectangle.north,
      CesiumMath.EPSILON10,
    );
    expect(provider.tileDiscardPolicy).toBeUndefined();

    spyOn(Resource._Implementations, "createImage").and.callFake(
      function (request, crossOrigin, deferred) {
        expect(request.url).toContain("/0/0/0");

        // Just return any old image.
        Resource._DefaultImplementations.createImage(
          new Request({ url: "Data/Images/Red16x16.png" }),
          crossOrigin,
          deferred,
        );
      },
    );

    return provider.requestImage(0, 0, 0).then(function (image) {
      expect(Resource._Implementations.createImage).toHaveBeenCalled();
      expect(image).toBeImageOrImageBitmap();
    });
  });

  it("uses maximumLevel passed to constructor", function () {
    const provider = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server",
      maximumLevel: 5,
    });
    expect(provider.maximumLevel).toEqual(5);
  });

  it("uses minimumLevel passed to constructor", function () {
    const provider = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server",
      minimumLevel: 1,
    });
    expect(provider.minimumLevel).toEqual(1);
  });

  it("uses retinaTiles passed to constructor", async function () {
    const provider = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server",
      retinaTiles: true,
    });

    spyOn(Resource._Implementations, "createImage").and.callFake(
      function (request, crossOrigin, deferred) {
        expect(request.url).toContain("0/0/0@2x.png");

        // Just return any old image.
        Resource._DefaultImplementations.createImage(
          new Request({ url: "Data/Images/Red16x16.png" }),
          crossOrigin,
          deferred,
        );
      },
    );

    const image = await provider.requestImage(0, 0, 0);
    expect(Resource._Implementations.createImage).toHaveBeenCalled();
    expect(image).toBeImageOrImageBitmap();
  });

  it("raises error event when image cannot be loaded", function () {
    const provider = new OpenStreetMapImageryProvider({
      url: "made/up/osm/server",
    });

    const layer = new ImageryLayer(provider);

    let tries = 0;
    provider.errorEvent.addEventListener(function (error) {
      expect(error.timesRetried).toEqual(tries);
      ++tries;
      if (tries < 3) {
        error.retry = true;
      }
      setTimeout(function () {
        RequestScheduler.update();
      }, 1);
    });

    Resource._Implementations.createImage = function (
      request,
      crossOrigin,
      deferred,
    ) {
      if (tries === 2) {
        // Succeed after 2 tries
        Resource._DefaultImplementations.createImage(
          new Request({ url: "Data/Images/Red16x16.png" }),
          crossOrigin,
          deferred,
        );
      } else {
        // fail
        setTimeout(function () {
          deferred.reject();
        }, 1);
      }
    };

    const imagery = new Imagery(layer, 0, 0, 0);
    imagery.addReference();
    layer._requestImagery(imagery);
    RequestScheduler.update();

    return pollToPromise(function () {
      return imagery.state === ImageryState.RECEIVED;
    }).then(function () {
      expect(imagery.image).toBeImageOrImageBitmap();
      expect(tries).toEqual(2);
      imagery.releaseReference();
    });
  });

  it("throws with more than four tiles at the minimum", function () {
    const rectangle = new Rectangle(
      0.0,
      0.0,
      CesiumMath.toRadians(1.0),
      CesiumMath.toRadians(1.0),
    );

    expect(function () {
      return new OpenStreetMapImageryProvider({
        minimumLevel: 9,
        rectangle: rectangle,
      });
    }).toThrowDeveloperError();
  });
});
