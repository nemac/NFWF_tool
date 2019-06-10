// const GDB_NAME = 'NFWF_HUBS_WITH_STATS_CONUS_01072019_gdb';
// const GDB_NAME = 'all_resiliencehubs_121818_rank_4326_zonal_stats_shifted_ids';
const GDB_NAME = 'all_resiliencehubs_121818_rank_4326_zonal_stats_shift_ids_gdb';
const QUERY_REQUEST_URL = `https://services1.arcgis.com/PwLrOgCfU0cYShcG/arcgis/rest/services/${GDB_NAME}/FeatureServer/0/query`;
const config = {
  fieldMaps: {
    terrestri: 'terrestrial',
    crit_fac: 'crit_facilities',
    pop_dens: 'pop_density',
    soc_vuln: 'social_vuln',
    floodprone: 'floodprone_areas',
    slr: 'sea_level_rise'
  },
  queryUrl: QUERY_REQUEST_URL,
  agolOutFields: [ 'TARGET_FID','exposure', 'asset', 'threat', 'aquatic', 'terrestri', 'hubs', 'crit_infra', 'crit_fac', 'pop_dens', 'soc_vuln', 'drainage', 'erosion', 'floodprone', 'geostress', 'slr', 'slope', 'stormsurge']
};

export default config;
