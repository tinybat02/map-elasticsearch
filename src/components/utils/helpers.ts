import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';

interface SingleData {
  coordinate: [number, number];
  mac_address: string;
  [key: string]: any;
}

const processDataES = (data: SingleData[]) => {
  // latest record per each mac_address
  const latestRecords = data.reduce((rv: { [key: string]: [number, number] }, item) => {
    if (!rv[item['mac_address']]) {
      rv[item['mac_address']] = item.coordinate;
    }
    return rv;
  }, {});
  const arrayCoordinations = Object.values(latestRecords);

  const dataPoints = arrayCoordinations.map(item => {
    return new Feature({
      geometry: new Point(fromLonLat(item)),
    });
  });

  const vectorSource = new VectorSource({
    features: dataPoints,
  });
  return vectorSource;
};

export { processDataES };
