export var mapConfig = {

  //ESRI Vector BaseMap
  ESRIVectorBasemap: {
    name: "DarkGray"
  },

  //tile layers (WMS)
  TMSLayers:[
    {
      id: "HubsTMS",
      layer: "Hubs TMS",
      label: "Resilience Hubs",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/HubsIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 13,
      tms: false,
      legend: "hub",
      description: "Areas of open lands and protected space that are most suitable for resilience-building efforts. Hubs are ranked by priority, given the level of exposure that nearby assets have to flood-related threats and the presence and abundance of fish and wildlife species within and surrounding the Hub."
    },
    {
      id: "ExposureTMS",
      layer: "Exposure TMS",
      label: "Community Exposure Index",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/ExposureIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 13,
      tms: false,
      legend: "exposure",
      description: "The product of the Asset and Threat Indices. Shows a range of areas on the landscape, from low to high, where community assets are exposed to flood threats."
    },
    {
      id: "AssetsTMS",
      layer: "Assets TMS",
      label: "Community Asset Index",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/AssetsIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 13,
      tms: false,
      legend: "asset",
      description: "Index describing community assets such as infrastructure critical to the recovery of an area and human population. A high value represents those areas with high levels of community assets on the landscape, usually more urban areas."
    },
    {
      id: "ThreatsTMS",
      layer: "Threats TMS",
      label: "Threats Index",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/ThreatsIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 13,
      tms: false,
      legend: "threat",
      description: "Index of flood-related datasets, including storm surge scenarios and landscape characteristics that exacerbate flood potential. High values in the Index represent those areas on the landscape where there are multiple high values of individual inputs."
    },
    {
      id: "AquaticTMS",
      layer: "Aquatic TMS",
      label: "Aquatic Index",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/AquaticIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "aquatic",
      description: "An index of priority aquatic species and their habitats, ranked by HUC-10 watershed. A high value represents watersheds where the most priority species and their habitats are present."
    },
    {
      id: "TerrestrialTMS",
      layer: "Terrestrial TMS",
      label: "Terrestrial Index",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/TerrestrialIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "terrestrial",
      description: "An index of priority terrestrial species and their habitats, ranked by HUC-10 watershed. This Index also includes Important Bird Areas, which transcend watershed boundaries. A high value represents areas where the most priority species, their habitats, and important bird areas are present."
    },
    {
      id: "PopDensityTMS",
      layer: "Population Density TMS",
      label: "Population Density",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/PopDensityIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-asset",
      description: "A ranking of population density by census blocks based on the 2016 American Community Survey. Areas are ranked from low to high using the ratio of people per square kilometer."
    },
    {
      id: "SocVulnTMS",
      layer: "Social Vulnerability TMS",
      label: "Social Vulnerability",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/SocVulnIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-asset",
      description: "Used to identify census blocks that are socially vulnerable using the Demographic Index in EPA’s EJSCREEN data. Census blocks above the 80th percentile are ranked from low to high, which indicates those census blocks that have the highest low income and minority populations."
    },
    {
      id: "CriticalFacilitiesTMS",
      layer: "Critical Facilities TMS",
      label: "Critical Facilities",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/CriticalFacilitiesIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-asset",
      description: "Those facilities, such as schools, hospitals, police and fire stations, that are important to a community in recovering from a flood event. Facilities are given a presence or absence score."
    },
    {
      id: "CriticalInfrastructureTMS",
      layer: "Critical Infrastructure TMS",
      label: "Critical Infrastructure",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/CriticalInfrastructureIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-asset",
      description: "Infrastructure in and around communities that is integral to a community’s ability to recover from a flood event, including primary highways, power plants, and rail lines. Each type is given a presence or absence score and all infrastructure is added together; highest values indicate areas where infrastructure is nearby or pieces overlap with one another."
    },
    {
      id: "DrainageTMS",
      layer: "Drainage TMS",
      label: "Drainage",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/DraingeIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-threat",
      description: "Used to identify areas of the landscape with poor drainage potential, including both soils and areas with high intensity development that do not readily drain and have runoff potential. A high value indicates areas that have soils with poor drainage potential and an intensity of developed impervious surfaces."
    },
    {
      id: "ErosionTMS",
      layer: "Erosion TMS",
      label: "Erosion",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/ErosionIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-threat",
      description: "Those soils identified as having a high probability of erodibility by the USDA Natural Resources Conservation Services. High values suggest that the area contains soils with a high erodibility factor."
    },
    {
      id: "SLRTMS",
      layer: "Sea Level Rise TMS",
      label: "Sea Level Rise",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/SLRIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-threat",
      description: "NOAA’s sea level rise scenarios are given rank values from low to high; low being a 5-foot scenario and high being a 1-foot scenario. These ranks are used to suggest the imminent threat of a 1-foot rise in sea level versus a 5-foot rise that may eventually occur."
    },
    {
      id: "StormSurgeTMS",
      layer: "Storm Surge TMS",
      label: "Storm Surge",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/StormSurgeIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-threat",
      description: "Based on storm category, surge is ranked from low to high. A high value indicates a Category 1 storm while a low value indicates a Category 5 storm. This inverse relationship between rank values and surge scenarios is a result of the probability of the category storm happening."
    },
    {
      id: "GeoStressTMS",
      layer: "Geo Stressors TMS",
      label: "Geo Stressors",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/GeoStressIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-threat",
      description: "The geologic conditions of the landscape that can exacerbate the level of threat represented from other inputs. Conditions that are highlighted in this input include both landslide susceptibility and subsidence."
    },
    {
      id: "SlopeTMS",
      layer: "Slope TMS",
      label: "Areas of Low Slope",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/SlopeIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-threat",
      description: "The percent rise of the elevation of the landscape, given values from low to high. High values indicate those areas that are very low lying and more likely to retain water and flood."
    },
    {
      id: "FloodProneAreasTMS",
      layer: "Flood Prone Areas TMS",
      label: "Flood Prone Areas",
      url: "http://nfwf-tiles.s3-website-us-east-1.amazonaws.com/FloodProneAreasIndexTiles/{z}/{x}/{y}.png",
      attribution: "NFWF 2018",
      format: "image/png",
      tileSize: 256,
      transparent: true,
      opacity: 0.75,
      zIndex: 9000,
      crs: L.CRS.EPSG3857,
      maxNativeZoom: 12,
      tms: false,
      legend: "driver-threat",
      description: "Areas of the landscape that are considered by FEMA to be in the 100- and 500-year flood zones, as well as the floodway. Frequently and occasionally flooded soil designations are used to identify areas outside of FEMA coverage. A high value indicates the floodway, while a low value indicates occasionally flooded soils outside of the floodplain."
    },
  ],


  //tile layers (WMS)
  TileLayers:[
    // {
    //   id: "SA_ExposureIndex",
    //   layer: "SA_ExposureIndex",
    //   label: "Exposure Index",
    //   url: "https://gis.nemac.org/nfwf?",
    //   attribution: "NFWF 2018",
    //   format: "image/png",
    //   tileSize: 256,
    //   transparent: true,
    //   opacity: 0.75,
    //   zIndex: 9000,
    //   crs: L.CRS.EPSG3857
    // },
    // {
    //   id: "SA_AssetIndex",
    //   layer: "SA_AssetIndex",
    //   label: "Asset Index",
    //   url: "https://gis.nemac.org/nfwf?",
    //   attribution: "NFWF 2018WF",
    //   format: "image/png",
    //   tileSize: 256,
    //   transparent: true,
    //   opacity: 0.75,
    //   zIndex: 8999,
    //   crs: L.CRS.EPSG3857
    // },
    // {
    //   id: "SA_ThreatIndex",
    //   layer: "SA_ThreatIndex",
    //   label: "Threat Index",
    //   url: "https://gis.nemac.org/nfwf?",
    //   attribution: "NFWF 2018",
    //   format: "image/png",
    //   tileSize: 256,
    //   transparent: true,
    //   opacity: 0.75,
    //   zIndex: 8999,
    //   crs: L.CRS.EPSG3857
    // },
    // {
    //   id: "SA_AquaticIndex",
    //   layer: "SA_AquaticIndex",
    //   label: "Aquatic Index",
    //   url: "https://gis.nemac.org/nfwf?",
    //   attribution: "NFWF 2018",
    //   format: "image/png",
    //   tileSize: 256,
    //   transparent: true,
    //   opacity: 0.75,
    //   zIndex: 8999,
    //   crs: L.CRS.EPSG3857
    // },
    // {
    //   id: "SA_TerrestrialIndex",
    //   layer: "SA_TerrestrialIndex",
    //   label: "Terrestrial Index",
    //   url: "https://gis.nemac.org/nfwf?",
    //   attribution: "NFWF 2018",
    //   format: "image/png",
    //   tileSize: 256,
    //   transparent: true,
    //   opacity: 0.75,
    //   zIndex: 8999,
    //   crs: L.CRS.EPSG3857
    // },
    // {
    //   id: "SA_HubsPreliminary",
    //   layer: "SA_HubsPreliminary",
    //   label: "Hubs (Preliminary)",
    //   url: "https://gis.nemac.org/nfwf?",
    //   attribution: "NFWF 2018",
    //   format: "image/png",
    //   tileSize: 256,
    //   transparent: true,
    //   opacity: 0.75,
    //   zIndex: 9001,
    //   crs: L.CRS.EPSG3857
    // }

 ],

 mapDefaults: {
    // center: [ 32.7765, -79.9311 ],
    // zoom: 12
    center: [ 36.27970720524017, -95.05371093750001],
    zoom: 4
 },

  //leaflet optoins expand as needed
  mapOptions: {
    // center: [ 32.7765, -79.9311 ],
    zoom: 4,
    maxZoom: 16,
    minZoom: 4,
    crs: L.CRS.EPSG3857
  }

};

export default mapConfig;
