// ============================================================
//  AUTOMATED DOWNSCALING OF TROPOMI SIF USING MODIS MCD43A4 (500 m)
//  Loop version with explicit bilinear interpolation
//  Author: Yakai Wang | Bilinear-resampling version
// ============================================================


// =======================
// 1. REGION OF INTEREST
// =======================
var connecticut = ee.FeatureCollection("TIGER/2018/States")
  .filter(ee.Filter.eq('NAME', 'Connecticut'));


// =======================
// 2. DEFINE TARGET SIF IMAGE DATES
// =======================
var dateStrings = [
  '2018-08-01', '2018-08-05', '2018-08-09', '2018-08-13', '2018-08-17',
  '2018-08-21', '2018-08-25', '2018-08-29'
];


// =======================
// 3. LOAD MODIS MCD43A4 AND COMPUTE NIRv
// =======================
// Band 2 = NIR, Band 1 = RED
// Apply reflectance scaling (×0.0001) and compute NIRv
var dataset = ee.ImageCollection('MODIS/006/MCD43A4')
  .select(['Nadir_Reflectance_Band2', 'Nadir_Reflectance_Band1'])
  .map(function (img) {
    var nir = img.select("Nadir_Reflectance_Band2").multiply(0.0001);
    var red = img.select("Nadir_Reflectance_Band1").multiply(0.0001);
    var NIRv = nir.subtract(red).multiply(nir).divide(nir.add(red)).rename('NIRv');
    return img.addBands(NIRv);
  });

// Store MODIS native projection
var modisProjection_ori = dataset.first().projection();
print('MODIS projection:', modisProjection_ori);


// =======================
// 4. LOOP THROUGH SIF IMAGES BY DATE
// =======================
for (var i = 0; i < dateStrings.length; i++) {

  var dateStr = dateStrings[i];
  print('Processing date:', dateStr);

  // --- Load corresponding SIF image ---
  var sifPath = 'users/wangyakai01/sif/TROPOMISIF16d4_' + dateStr;
  var sifimage = ee.Image(sifPath);
  var sifProjection = sifimage.projection();

  // --- Define reprojection function (MODIS → SIF CRS) ---
  // Use bilinear interpolation for smooth resampling
  var reprojToSIF = function (image) {
    return image.select('NIRv').resample('bilinear').reproject({
      crs: sifProjection
    });
  };

  // --- Filter MODIS NIRv near this date (±8 days window) ---
  var modisFiltered = dataset.filterDate(
    ee.Date(dateStr).advance(-8, 'day'),
    ee.Date(dateStr).advance(8, 'day')
  );

  // Original and reprojected NIRv
  var NIRv_ori = modisFiltered.select('NIRv');
  var NIRv_sif = modisFiltered.map(reprojToSIF);
  var NIRv_mean = NIRv_sif.mean();  // Mean NIRv (reprojected)

  // --- Calculate ratio (SIF / NIRv) ---
  // Use bilinear interpolation for smoother ratio scaling
  var ratioimage = sifimage.divide(NIRv_mean)
    .resample('bilinear')
    .reproject({ crs: modisProjection_ori })
    .rename('Ratio');

  // --- Compute downscaled SIF_RE (in mW m-2 sr-1 nm-1) ---
  var sif_re = NIRv_ori.mean()
    .multiply(ratioimage)
    .divide(1000) //Scale factor
    .rename('SIF_RE')
    .resample('bilinear') // Maintain smoothness after multiplication
    .reproject({ crs: modisProjection_ori });

  // --- Export only SIF_RE ---
  Export.image.toDrive({
    image: sif_re,
    description: 'SIF_500m_' + dateStr,
    folder: 'SIF_500',
    region: connecticut.geometry(),
    scale: 500,
    crs: 'EPSG:4326',
    maxPixels: 1e13
  });

  print('Queued SIF_RE export for date:', dateStr);
}


// =======================
// 5. END OF SCRIPT
// =======================
print('All SIF_RE exports (bilinear) queued successfully.');
