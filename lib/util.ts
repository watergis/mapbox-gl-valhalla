export const createSelection = (
  data : Object,
  title: string,
  type:string,
  defaultValue: any,
  converter: Function,
): HTMLElement => {
  const label = document.createElement('label');
  label.textContent = title;

  const content = document.createElement('select');
  content.setAttribute('id', `mapbox-gl-valhalla-${type}`);
  content.style.width = '100%';
  Object.keys(data).forEach((key) => {
    const optionLayout = document.createElement('option');
    optionLayout.setAttribute('value', converter(data, key));
    optionLayout.appendChild(document.createTextNode(key));
    optionLayout.setAttribute('name', type);
    if (defaultValue === data[key]) {
      optionLayout.selected = true;
    }
    content.appendChild(optionLayout);
  });

  const tr1 = document.createElement('TR');
  const tdLabel = document.createElement('TD');
  const tdContent = document.createElement('TD');
  tdLabel.appendChild(label);
  tdContent.appendChild(content);
  tr1.appendChild(tdLabel);
  tr1.appendChild(tdContent);
  return tr1;
};

export const createTextbox = (
  title: string,
  type:string,
  defaultValue: any,
  readOnly: boolean,
): HTMLElement => {
  const label = document.createElement('label');
  label.textContent = title;

  const content = document.createElement('input');
  content.setAttribute('id', `mapbox-gl-valhalla-${type}`);
  content.setAttribute('type', 'text');
  content.setAttribute('value', defaultValue);
  content.readOnly = readOnly;

  const tr1 = document.createElement('TR');
  const tdLabel = document.createElement('TD');
  const tdContent = document.createElement('TD');
  tdLabel.appendChild(label);
  tdContent.appendChild(content);
  tr1.appendChild(tdLabel);
  tr1.appendChild(tdContent);
  return tr1;
};
