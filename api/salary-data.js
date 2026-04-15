const SALARY_DATA = {
  L: ["21/02","21/03","21/04","21/05","21/06","21/07","21/08","21/09","21/10","21/11","21/12","22/01","22/02","22/03","22/04","22/05","22/06","22/07","22/08","22/09","22/10","22/11","22/12","23/01","23/02","23/03","23/04","23/05","23/06","23/07","23/08","23/09","23/10","23/11","23/12","24/01","24/02","24/03","24/04","24/05","24/06","24/07","24/08","24/09","24/10","24/11","24/12","25/01","25/02","25/03","25/04","25/05","25/06","25/07","25/08","25/09","25/10","25/11","25/12","26/01","26/02","26/03","26/04","26/05","26/06","26/07","26/08","26/09","26/10","26/11","26/12"],
  CUTOFF: 62,
  OUTSOURCE_START: 47,
  OVERSEAS_START: 40,
  OVERSEAS_DATA: [56.5,101.5,77.2,20.9,21.4,23.2,26.0,43.8,41.3,48.5,69.2,79.5,81.4,79.3,97.7,97.6,108.6,109.3,112.4,111.6,115.5,115.6,106.5,108.0,101.8,113.7,107.9,112.6,112.6],
  SALES: ["米倉","南部","日浅","龍河","生島"],
  DEV: ["及川","アウン","アーロン","へいん"],
  C: {"米倉":"#378ADD","及川":"#1D9E75","アウン":"#7F77DD","アーロン":"#BA7517","南部":"#D85A30","日浅":"#D4537E","龍河":"#639922","へいん":"#888780","生島":"#444441"},
  BONUS_SPLIT: {
    "米倉":{"18":[35,120],"23":[35,120],"30":[35,210],"35":[35,250],"47":[36.9,180],"59":[42.4,180]},
    "及川":{"22":[28.2,17.6],"26":[29.8,35],"64":[42.4,124]},
    "アウン":{"22":[34,16],"63":[41.1,20]},
    "アーロン":{"62":[30.5,35]},
    "南部":{"46":[31.5,21],"58":[40,30]},
    "日浅":{"64":[35,31]},
    "龍河":{"70":[42,48]},
    "へいん":{},"生島":{}
  },
  R: {
    "米倉":  [2,2,2,2,2,20,20,20,20,20,20,20,20,20,20,20,35,35,155,35,35,35,35,155,35,35,35,35,35,35,245,35,35,35,35,285,35,35,35,35,35,36.9,36.9,36.9,36.9,36.9,36.9,216.9,36.9,36.9,36.9,42.4,42.4,42.4,42.4,42.4,42.4,42.4,42.4,222.4,42.4,42.4,42.4,51,51,51,51,51,51,51,51,51],
    "及川":  [null,null,null,4,8,24,24,24,24,24,24,25,25,25,25,25,28.2,28.2,28.2,28.2,28.2,28.2,45.8,29.8,29.8,29.8,64.8,29.8,29.8,29.8,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,42.4,42.4,42.4,42.4,42.4,42.4,42.4,42.4,42.4,42.4,42.4,42.4,166.4,48,48,48,48,48,48,48],
    "アウン": [null,null,null,27,27,27,27,27,27,28,28,28,28,28,28,30.5,30.5,30.5,30.5,30.5,30.5,34,50,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,36.8,36.8,36.8,36.8,36.8,36.8,36.8,36.8,36.8,36.8,36.8,39.7,39.7,39.7,39.7,39.7,39.7,39.7,39.7,39.7,41.1,41.1,41.1,61.1,41.1,41.1,46.2,46.2,46.2,46.2,46.2,46.2],
    "アーロン":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,24.5,24.5,24.5,24.5,24.5,24.5,24.5,26.8,26.8,26.8,26.8,26.8,26.8,30.5,30.5,30.5,30.5,30.5,30.5,65.5,30.5,30.5,36,36,36,36,36,36],
    "南部":  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,30,30,30,30,30,30,31.5,31.5,31.5,31.5,31.5,31.5,31.5,31.5,31.5,31.5,52.5,31.5,31.5,31.5,31.5,32.8,32.8,32.8,32.8,32.8,32.8,40,70,40,40,40,40,40,40,40,40,40,40,40,null,null],
    "日浅":  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,35,35,35,35,35,35,35,35,66,36,36,36,36,36,36],
    "龍河":  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,36,36,36,36,42,42,42,42,42,90],
    "へいん": [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,25.8,25.8,25.8,25.8,25.8,25.8],
    "生島":  [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,58,58,58,58,58]
  }
};

export default async function handler(req, res) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/wv_session=([^;]+)/);
  if (!match) return res.status(401).json({error: 'unauthorized'});
  try {
    const data = JSON.parse(Buffer.from(match[1], "base64").toString());
    if (!data.auth) return res.status(401).json({error: 'unauthorized'});
  } catch { return res.status(401).json({error: 'unauthorized'}); }
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(SALARY_DATA);
}
