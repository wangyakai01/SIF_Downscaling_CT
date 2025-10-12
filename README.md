# SIF_Downscaling_CT
**Downscaling of TROPOMI SIF using MODIS MCD43A4 NIRv for Connecticut**

This repository contains Earth Engine scripts and documentation for downscaling
TROPOMI Solar-Induced chlorophyll Fluorescence (SIF) data from ~7 km to 500 m resolution
using MODIS MCD43A4 NIRv as a spatial predictor.

---

##  Overview

The workflow aligns MODIS 500 m surface reflectance (NIR & RED) with TROPOMI SIF
data to produce high-resolution SIF estimates (SIF_RE) for Connecticut:

1. Compute NIRv from MODIS MCD43A4 bands:
   \[
   NIRv = ((NIR - RED) \times NIR) / (NIR + RED)
   \]
2. Bilinearly resample NIRv to match the SIF projection.
3. Compute ratio \( R = SIF / NIRv \).
4. Downscale SIF:
   \[
   SIF_{RE} = NIRv_{MODIS} \times R
   \]
   
---

##  Script
Main script: [`scripts/sif_downscale_bilinear.js`]

Key features:
- Bilinear interpolation for smooth spatial resampling  
- Automated multi-date processing loop  
- 500 m MODIS-aligned outputs (`SIF_500m_YYYY-MM-DD.tif`)  
- Exports to Google Drive  

---

##  Data Sources
- **TROPOMI SIF:** `users/wangyakai01/sif/TROPOMISIF16d4_*`
- **MODIS MCD43A4:** MODIS/006/MCD43A4 (Bands 1 & 2, 500 m)
- **Region:** Connecticut, USA (TIGER/2018/States)



##  Acknowledgements
Developed at the University of Connecticut using Google Earth Engine.

