import { Dropdown } from "primereact/dropdown"
import { useState } from "react"

export const SettingsListEditor = (props) => {
    let [selectedSettings, setSelectedSettings] = useState()
    let settings = props['settings']
    let cellEditor = props['cellEditor']

    const getSettingsListComponents = (settings) => {
        return settings.value.filter((setting) => {
            return setting.name === selectedSettings
        }).map((setting) => {
            return setting.settings.map((setting) => {
                return (<div key={"group-" + setting.property} className="p-inputgroup">
                    <label key={"label-" + setting.property} htmlFor={setting.property} style={{ textAlign: 'left', color: 'white', width: '20%' }}>{setting.property.replaceAll('_', ' ')}</label>
                    {cellEditor(setting)}
                </div>)
            })
        })
    }

    return (!settings ? "" :
        <div>
            <div className="p-inputgroup" style={{ width: '100%', height: '50px', border: "none" }}>
                <label className="mt-2" style={{ textAlign: 'left', color: 'white', width: '20%' }}>Type</label>
                <Dropdown key={settings.property}
                    value={selectedSettings}
                    options={settings.value.map((setting) => { return setting.name })}
                    style={{ textAlign: "left" }}
                    onChange={(e) => { setSelectedSettings(e.value) }} />
            </div>
            <div selectedSettings={selectedSettings}>
                { //false &&
                    getSettingsListComponents(settings)
                }
            </div>
        </div>
    )
}