import { React, useState } from 'react';

import footer_image from '../assets/images/logo-pnrr.jpg'

import { Panel } from 'primereact/panel';
import { Image } from 'primereact/image';

export function Footer() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Panel
        className="Footer"
        header="&copy; University of Trento - 2023"
        toggleable
        collapsed={ JSON.parse(window.localStorage.getItem("footerIsCollapsed") || false )}
        onToggle={ (e) => {
            let footerIsCollapsed = JSON.stringify(e.value)
            window.localStorage.setItem("footerIsCollapsed", footerIsCollapsed)
            setCollapsed(footerIsCollapsed)
        } }
        >
        <Image src={footer_image} width='100%'/>
    </Panel>
  );
}
