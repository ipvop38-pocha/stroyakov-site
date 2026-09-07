const number = value => String(Number(value.replace(',', '.'))).replace('.', ',');
const joined = (...parts) => parts.filter(Boolean).join(', ');
const dimensions = raw => raw.match(/\d+(?:[.,]\d+)?(?:\s*[×хx*]\s*\d+(?:[.,]\d+)?){1,3}/i)?.[0].split(/\s*[×хx*]\s*/i).map(number);
const displayBrands = { DANOGIPS:'Danogips', РУСГИПС:'Русгипс', KNAUF:'КНАУФ', ВОЛМА:'ВОЛМА', ОСНОВИТ:'Основит', ХАБЕЗ:'Хабез', CERESIT:'Ceresit', IZOLIFE:'Izolife', KRATEX:'Kratex', ROKS:'Рокс', MAXITOOL:'MaxiTool', SATENTEK:'Satentek', ULTRADECOR:'Ultradecor' };

// These are packaging/dimension fields from the warehouse, not inferred chemical properties.
export function inventoryPresentation(live, category, subgroup, brand, fallback) {
  const raw=live.rawName.normalize('NFKC').replace(/\s+/g,' ').trim();
  const b=displayBrands[brand] || brand;
  const size=dimensions(raw);
  const facets={};
  const set=(key,value)=>{if(value) facets[key]=[value];};
  const pack=[...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*(кг|л|г)(?=$|[^а-я])/ig)]
    .filter(m=>m[2].toLowerCase()!=='г'||!/[\/\-−]/.test(raw[m.index+m[0].length]||''))
    .map(m=>`${number(m[1])} ${m[2].toLowerCase()}`);
  if (!pack.length && /Сухие смеси|Цемент/.test(category)) {
    const bag=raw.match(/(?:\(|\s)(\d{2})\s*\/\s*\d+(?:\D|$)/);
    if(bag) pack.push(`${bag[1]} кг`);
  }
  if (pack.length && !/Металлопрокат|Профили/.test(category)) facets.packing=[...new Set(pack)];
  const quantity=raw.match(/(?:<|\(|,|\s)(\d+)\s*шт(?:\.?|\/уп)/i)?.[1] || (subgroup==='Саморезы' ? raw.match(/\((\d{3,4})\)/)?.[1] : undefined);
  let name=fallback;
  if(subgroup==='Саморезы') {
    const purpose=/кров/i.test(raw)?'кровельный по металлу':/прессшайб|п\/ш/i.test(raw)?`с прессшайбой ${/сверл/i.test(raw)?'сверло':'острый'}`:/ГКЛ\+металл/i.test(raw)?'для ГКЛ по металлу':/металл/i.test(raw)?'по металлу':/редкий шаг/i.test(raw)?'с редким шагом':/\(LN\)/i.test(raw)?'LN':'';
    const measure=size ? `${size.join('×')} мм` : raw.match(/ГКЛ\+металл\s+(\d+)/i)?.[1] ? `${raw.match(/ГКЛ\+металл\s+(\d+)/i)[1]} мм` : '';
    name=joined(`Саморез ${b ? b+' ' : ''}${purpose}`.trim(),measure,quantity?`${quantity} шт.`:'');
    set('length',size?.[1] || measure.match(/^(\d+) мм/)?.[1]);
    if(/металл|прессшайб|п\/ш|\(LN\)/i.test(raw)) set('purpose',/кров/i.test(raw)?'Кровельные':'По металлу');
    if(quantity) set('packing',`${quantity} шт.`);
  }
  if (/^(Стеновые|Потолочные) профили$/.test(subgroup)) {
    const type=raw.match(/профиль\s+(ПСН|ППН|ПС|ПП|ПН)/i)?.[1].toUpperCase();
    const section=raw.match(/(?:^|[^\d.,])(\d{2,3})\s*[*×хx/]\s*(\d{2})(?=$|[^\d])/i);
    const thick=raw.match(/(?:^|[^\d])(0[.,]\d+)/)?.[1];
    const len=raw.match(/(?:L\s*=\s*|длина\s*)(\d+(?:[.,]\d+)?)\s*м/i)?.[1] || raw.match(/[*×хx](\d{4})\s*мм/i)?.[1];
    const length=len ? Number(len.replace(',','.'))>100?number(String(Number(len)/1000)):number(len) : '';
    name=joined(`Профиль ${b ? b+' ' : ''}${type||''}`.trim(),section?`${section[1]}×${section[2]} мм`:'',thick?`толщина ${number(thick)} мм`:'',length?`${length} м`:'');
    set('profileSize',section?`${section[1]} × ${section[2]}`:''); set('thickness',thick?number(thick):'');
    set('profileType',type ? /ПН|ПСН|ППН/.test(type)?'Направляющий':type==='ПС'?'Стоечный':'Потолочный':'');
  }
  if(subgroup==='Маяки металлические') {
    const height=raw.match(/(?:мая[чк][^\d]*|ПМ-)(6|10)/i)?.[1];
    const thick=raw.match(/(0[.,]\d+)/)?.[1];
    const len=raw.match(/(?:\s|\/)(3000|3\s*м)(?:\D|$)/i)?'3 м':'';
    name=joined(`Профиль маячковый${b?' '+b:''}`,height?`${height} мм`:'',thick?`толщина ${number(thick)} мм`:'',len);
    set('thickness',height);
  }
  if (category==='Металлопрокат') {
    const lenRaw=raw.match(/дл\.?\s*(\d+(?:[.,]\s*\d+)?)/i)?.[1]
      || raw.match(/(?:\s|-)(6|12)\s*м(?=$|[^а-я])/i)?.[1]
      || raw.match(/(?:^|\s)(6000|12000)(?=$|\s)/)?.[1];
    const len=lenRaw ? number(String(Number(lenRaw.replace(',','.').replace(/\s/g,''))/(Number(lenRaw)>100?1000:1))) : '';
    const tail=len?`${len} м`:'';
    if(subgroup==='Трубы') {
      const square=/квадрат/i.test(raw), water=/ВГП|вод\/газ/i.test(raw);
      const profile=square||/прямоуг|профильн/i.test(raw);
      let dims=size?[...size]:[];
      // Warehouse shorthand "квадрат 20×2" means side × wall, unlike "10×10" (wall unspecified).
      if(square && dims.length===2 && Number(dims[1].replace(',','.'))<Number(dims[0].replace(',','.'))/2) dims=[dims[0],dims[0],dims[1]];
      if(water && dims.at(-1)==='6000') dims.pop();
      name=joined(`Труба ${water?'водогазопроводная':profile?'профильная':'электросварная'}`,dims.length?`${water?'ДУ ':''}${dims.join('×')} мм`:'',tail || (size?.at(-1)==='6000'?'6 м':''));
      set('shape',water?'Водогазопроводная':profile?(square||dims[0]===dims[1]?'Квадратная':'Прямоугольная'):'Круглая');
      if(profile && dims.length===3) set('thickness',dims[2]);
      if(!profile && dims.length===2) set('thickness',dims[1]);
      if(profile && dims.length>=2) set('profileSize',`${dims[0]} × ${dims[1]}`);
    } else if(subgroup==='Арматура') {
      const noStandards=raw.replace(/ГОСТ\s*\d+(?:\/\d+)?/ig,'').replace(/Ст3пс/ig,'');
      const diameter=noStandards.match(/\s(\d{1,2})\s*дл/i)?.[1];
      const grade=raw.match(/А500С|А240С/i)?.[0] || (/А1\(240\)/i.test(raw)?'А240':'');
      name=joined(`Арматура${grade?' '+grade:''}`,diameter?`Ø${diameter} мм`:'',tail);
      set('diameter',diameter); set('shape',grade==='А240'||grade==='А240С'?'Гладкая':'Рифлёная');
    } else if(subgroup==='Катанка') {
      const diameter=raw.match(/^катанка\s+(\d+(?:[.,]\d+)?)/i)?.[1];
      name=joined(`Катанка${/прутк/i.test(raw)?' в прутках':''}`,diameter?`Ø${number(diameter)} мм`:'',tail);
      set('diameter',diameter?number(diameter):'');
    } else if(subgroup==='Листы стальные') {
      const pvl=/ПВЛ/i.test(raw);
      name=joined(`Лист ${pvl?'просечно-вытяжной ПВЛ-506':/х\/к/i.test(raw)?'стальной холоднокатаный':'стальной горячекатаный'}`,size?`${(pvl?size.slice(1):size).join('×')} мм`:'');
      if(!pvl)set('thickness',size?.[0]);
      set('shape',pvl?'Просечно-вытяжной':/х\/к/i.test(raw)?'Холоднокатаный':'Горячекатаный');
    } else if(subgroup==='Швеллеры') {
      const kind=raw.match(/(\d+(?:[.,]\d+)?)\s*([ПУ])(?=$|[^а-я])/i);
      name=joined(`Швеллер ${/гнут/i.test(raw)?'гнутый':kind?number(kind[1])+kind[2].toUpperCase():''}`.trim(),/гнут/i.test(raw)&&size?`${size.join('×')} мм`:'',tail);
    } else if(subgroup==='Полосы стальные') name=joined('Полоса стальная горячекатаная',size?`${size.join('×')} мм`:'',tail);
    else if(subgroup==='Уголки стальные') {
      const section=size?.length===2&&/р\/пол/i.test(raw)?[size[0],size[0],size[1]]:size;
      name=joined('Уголок стальной',section?`${section.join('×')} мм`:'',tail);
    }
    else if(subgroup==='Проволока') name=joined('Проволока вязальная',raw.match(/ф(\d+(?:[.,]\d+)?)/i)?`Ø${number(raw.match(/ф(\d+(?:[.,]\d+)?)/i)[1])} мм`:'');
    else if(subgroup==='Заглушки для труб') name=joined('Заглушка для профильной трубы',size?`${size.join('×')} мм`:'');
    if(len)set('stockLength',len);
  }
  return { name, facets, packing:pack };
}

export function tidyTitle(value) {
  return value.replace(/шпатлевк|шпаклевк/gi,'шпаклёвк').replace(/^шпаклёвк/,'Шпаклёвк')
    .replace(/(\d)\s*[хx*]\s*(?=\d)/gi,'$1×').replace(/(\d)\.(?=\d)/g,'$1,')
    .replace(/(\d)\s*(мм|кг|мкм|л)(?=$|[^а-я])/gi,'$1 $2').replace(/\s+,/g,',').replace(/\s{2,}/g,' ').trim();
}
