// config file for search by hubs or should I do resliecen project.
//   field mappings designed to map the AGOL fields to the fields designed to mapConfig fields specicially hubsapikey
//   are field in hubs data on AGOL agolOutFields: field degined in mapconfig hubsapikey
//   we use a filter to get region singled out
const config = [
  {
    fieldMaps: {
      hub_rnk: 'hubs',
      exposure: 'exposure',
      asset: 'asset',
      aquatic: 'aquatic',
      terrestri: 'terrestrial',
      crit_infra: 'crit_infra',
      crit_fac: 'crit_facilities',
      pop_dens: 'pop_density',
      soc_vuln: 'social_vuln',
      impermeabl: 'impermeable',
      erosion: 'erosion',
      landslides: 'landslides',
      floodprone: 'floodprone_areas',
      slr: 'sea_level_rise',
      slope: 'slope',
      stormsurge: 'stormsurge',
      wildlife: 'fishandwildlife',
      geostress: 'geostress'
    },
    region: 'continental_us',
    queryUrl: `https://services1.arcgis.com/PwLrOgCfU0cYShcG/ArcGIS/rest/services/CONUS_hubs_staging_073020/FeatureServer/0/query`,
    agolOutFields: [ 'TARGET_FID','exposure', 'asset', 'threat', 'aquatic', 'terrestri', 'wildlife' , 'hub_rnk', 'crit_infra', 'crit_fac', 'pop_dens', 'soc_vuln', 'drainage', 'erosion', 'floodprone', 'geostress', 'slr', 'slope', 'stormsurge']
  },
  {
    fieldMaps: {
      hub_rnk: 'hubs',
      exposure: 'exposure',
      asset: 'asset',
      marine: 'marine',
      terrestri: 'terrestrial',
      crit_infra: 'crit_infra',
      crit_fac: 'crit_facilities',
      pop_dens: 'pop_density',
      soc_vuln: 'social_vuln',
      impermeabl: 'impermeable',
      erosion: 'erosion',
      landslides: 'landslides',
      floodprone: 'floodprone_areas',
      slr: 'sea_level_rise',
      slope: 'slope',
      stormsurge: 'storm_surge',
      wildlife: 'wildlife',
      tsunami: 'tsunami'
    },
    region: 'puerto_rico',
    queryUrl: `https://services1.arcgis.com/PwLrOgCfU0cYShcG/arcgis/rest/services/PR_hubs_staging_073020/FeatureServer/0/query`,
    agolOutFields: [ 'TARGET_FID','exposure', 'asset', 'threat', 'marine', 'terrestri', 'hub_rnk', 'crit_infra', 'crit_fac', 'pop_dens', 'soc_vuln', 'impermeabl', 'erosion', 'floodprone', 'landslides', 'slr', 'low_areas', 'stormsurge', 'tsunami', 'wildlife'  ]
  },
  {
    fieldMaps: {
      hub_rnk: 'hubs',
      exposure: 'exposure',
      asset: 'asset',
      marine: 'marine',
      terrestri: 'terrestrial',
      crit_infra: 'crit_infra',
      crit_fac: 'crit_facilities',
      pop_dens: 'pop_density',
      soc_vuln: 'social_vuln',
      impermeabl: 'impermeable',
      erosion: 'erosion',
      landslides: 'landslides',
      floodprone: 'floodprone_areas',
      slr: 'sea_level_rise',
      slope: 'slope',
      stormsurge: 'storm_surge',
      wildlife: 'wildlife'
    },
    region: 'us_virgin_islands',
    queryUrl: `https://services1.arcgis.com/PwLrOgCfU0cYShcG/arcgis/rest/services/USVI_hubs_staging_073020/FeatureServer/0/query`,
    agolOutFields: [ 'TARGET_FID','exposure', 'asset', 'threat', 'marine', 'terrestri', 'hub_rnk', 'crit_infra', 'crit_fac', 'pop_dens', 'soc_vuln', 'impermeabl', 'erosion', 'floodprone', 'slr', 'low_areas', 'stormsurge', 'wildlife'  ]
  },
  {
    fieldMaps: {
      hub_rnk: 'hubs',
      exposure: 'exposure',
      asset: 'asset',
      marine: 'marine',
      terrestri: 'terrestrial',
      crit_infra: 'crit_infra',
      crit_fac: 'crit_facilities',
      pop_dens: 'pop_density',
      soc_vuln: 'social_vuln',
      impermeabl: 'impermeable',
      erosion: 'erosion',
      landslides: 'landslides',
      floodprone: 'floodprone_areas',
      slr: 'sea_level_rise',
      slope: 'slope',
      wave_flood: 'wave_flooding',
      wildlife: 'wildlife'
    },
    region: 'northern_mariana_islands',
    queryUrl: `https://services1.arcgis.com/PwLrOgCfU0cYShcG/arcgis/rest/services/CNMI_hubs_staging_073020/FeatureServer/0/query`,
    agolOutFields: [ 'TARGET_FID','exposure', 'asset', 'threat', 'marine', 'terrestri', 'hub_rnk', 'crit_infra', 'crit_fac', 'pop_dens', 'soc_vuln', 'impermeabl', 'erosion', 'floodprone', 'slr', 'low_areas', 'wildlife', 'wave_flood'  ]
  },

  {
    fieldMaps: {
      hub_rnk: 'hubs',
      exposure: 'exposure',
      asset: 'asset',
      marine: 'marine',
      terrestri: 'terrestrial',
      crit_infra: 'crit_infra',
      crit_fac: 'crit_facilities',
      pop_dens: 'pop_density',
      soc_vuln: 'social_vuln',
      impermeabl: 'impermeable',
      erosion: 'erosion',
      landslides: 'landslides',
      floodprone: 'floodprone_areas',
      slr: 'sea_level_rise',
      slope: 'slope',
      wave_flood: 'wave_flooding',
      wildlife: 'wildlife'
    },
    region: 'northern_mariana_islands',
    queryUrl: `https://services1.arcgis.com/PwLrOgCfU0cYShcG/arcgis/rest/services/CNMI_hubs_staging_073020/FeatureServer/0/query`,
    agolOutFields: [ 'TARGET_FID','exposure', 'asset', 'threat', 'marine', 'terrestri', 'hub_rnk', 'crit_infra', 'crit_fac', 'pop_dens', 'soc_vuln', 'impermeabl', 'erosion', 'floodprone', 'slr', 'low_areas', 'wildlife', 'wave_flood'  ]
  },
  {
    fieldMaps: {
      hub_rnk: 'hubs',
      exposure: 'exposure',
      asset: 'asset',
      marine: 'marine',
      terrestri: 'terrestrial',
      crit_infra: 'crit_infra',
      crit_fac: 'crit_facilities',
      pop_dens: 'pop_density',
      soc_vuln: 'social_vuln',
      impermeabl: 'impermeable',
      erosion: 'erosion',
      landslides: 'landslides',
      floodprone: 'floodprone_areas',
      slr: 'sea_level_rise',
      slope: 'slope',
      stormsurge: 'storm_surge',
      wildlife: 'wildlife',
      tsunami: 'tsunami'
    },
    region: 'hawaii',
    queryUrl: `https://services1.arcgis.com/PwLrOgCfU0cYShcG/arcgis/rest/services/NFWF_CREST_Hawaii_Hubs_Cores_11242020/FeatureServer/0/query`,
    agolOutFields: [ 'TARGET_FID','exposure', 'asset', 'threat', 'marine', 'terrestri', 'hub_rnk', 'crit_infra', 'crit_fac', 'pop_dens', 'soc_vuln', 'impermeabl', 'erosion', 'floodprone', 'landslides', 'slr', 'low_areas', 'stormsurge', 'tsunami', 'wildlife'  ]
    // agolOutFields: [ 'TARGET_FID','exposure', 'asset', 'threat', 'marine', 'terrestri', 'hub_rnk', 'crit_infra', 'crit_fac', 'pop_dens', 'soc_vuln', 'impermeabl', 'erosion', 'floodprone', 'slr', 'low_areas', 'wildlife'  ]
  },
];

  export default config;
