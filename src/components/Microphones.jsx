import React, { Component } from 'react'
import * as styles from '../assets/css/microphones.css'
import classNames from 'classnames'
import {
    serverIP,
    socketPort,
} from '../../config'
import io from 'socket.io-client'
const socket = io.connect('http://' + serverIP + ':' + socketPort)

class Mic extends Component {
    constructor(props) {
        super(props)
    }

    setSelectedMicrophones(index) {
        var selectedMicrophones = this.props.podware.selectedMicrophones
        const currentAppState = this.props.podware
        var newAppState
        if(!selectedMicrophones.includes(index)) { // ADD MIC
            selectedMicrophones.push(index)
            newAppState = {
                ...currentAppState,
                selectedMicrophones
            }
        }
        else { // REMOVE MIC
            const newSelected = []
            selectedMicrophones.forEach(mic => {
                if(mic != index) {
                    newSelected.push(mic)
                }
            })
            newAppState = {
                ...currentAppState,
                selectedMicrophones: newSelected
            }
        }
        socket.emit('updateAppState', newAppState)
    }

    render() {
        const isSelected = this.props.podware.selectedMicrophones.includes(this.props.index)
        const micStyle = classNames(
            styles.micItem,
            isSelected ? styles.micItemSelect : styles.micItemUnSelect
        )
        return (
            <li className={micStyle} onClick={() => this.setSelectedMicrophones(this.props.index)}>{this.props.device}</li>
        )
    }
}

class MicrophoneList extends Component {

    constructor(props) {
        super(props)
        this.list = []
    }

    componentWillReceiveProps(newProps) {
        this.list = newProps.list
    }

    render() {
        var microphoneList = []
        this.list.forEach((device, index) => microphoneList.push(<Mic device={device} key={index} index={index} {...this.props} />))
        return (
            <ul className={styles.micList}>{microphoneList}</ul>
        )
    }
}

export default class Microphones extends Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
        socket.emit('queryAvailableMicrophones')
    }

    render() {
        return (
            <div className={styles.microphones}>
                <div className={styles.microphonesTitle}>select your microphones:</div>
                <MicrophoneList list={this.props.podware.mics} {...this.props} />
            </div>
        )
    }
}
