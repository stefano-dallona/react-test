import { React, useState } from 'react';

import footer_image from '../assets/images/logo-pnrr.jpg'

import { Panel } from 'primereact/panel';
import { Image } from 'primereact/image';

import { useLocalStorage } from 'usehooks-ts';

export function Footer() {
  //const [collapsed, setCollapsed] = useState(true);
  const [collapsed, setCollapsed, unsetCollapsed] = useLocalStorage('footerIsCollapsed', false)

  return (
    <Panel
        className="Footer"
        header="&copy; University of Trento - 2023"
        toggleable
        //collapsed={ JSON.parse(window.localStorage.getItem("footerIsCollapsed") || false )}
        collapsed={ collapsed }
        onToggle={ (e) => {
            let footerIsCollapsed = JSON.stringify(e.value)
            //window.localStorage.setItem("footerIsCollapsed", footerIsCollapsed)
            //window.dispatchEvent(new Event('storage'))
            //setCollapsed(footerIsCollapsed)
            setCollapsed(e.value)
        } }
        >
        <Image src={footer_image} width='100%'/>
    </Panel>
  );
}
