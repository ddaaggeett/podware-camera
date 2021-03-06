import { queryAvailableMicrophones } from './mics/devices'
import { queryRemotes, } from '../objects/Remote'
var usb = require('usb')
var fs = require('fs')

export const queryAllDevices = () => {
    setTimeout(() => {  //  TODO: alternative method. current: able to read adb devices 1 second after usb plug in/out
        queryAvailableMicrophones()
        queryRemotes()
    }, 1000)
}

usb.on('attach', () => {
    queryAllDevices()
})
usb.on('detach', () => {
    queryAllDevices()
})

export { Mic } from './mics'
export { Camera } from './cameras'
