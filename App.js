/*
import React, { Component } from 'react';
import { Provider } from 'react-redux'
import { getRootNavigator } from './src/navigator'
import changefeedListeners from './src/db/changefeed-listeners'
import { store } from './src/redux';

changefeedListeners(store)

const RootNavigator = getRootNavigator()

export default class App extends Component {
	constructor(props) {
		super(props)
	}
	render() {
		return (
			<Provider store={store}>
				<RootNavigator {...this.props} />
			</Provider>
		)
	}
}
*/

import React, { Component } from 'react'
import {
    StatusBar,
    StyleSheet,
    Text,
    View,
    PermissionsAndroid,
} from 'react-native'
import { RNCamera } from 'react-native-camera'
import {
    serverIP,
    socketPort,
    podwareCameraDir,
} from './config'
import RNFetchBlob from 'rn-fetch-blob'
import DeviceInfo from 'react-native-device-info'
import KeepAwake from 'react-native-keep-awake'
import io from 'socket.io-client/dist/socket.io'
const socket = io.connect('http://' + serverIP + ':' + socketPort)
const device = DeviceInfo.getSerialNumber()

export default class App extends Component<Props> {

    constructor() {
        super()
        KeepAwake.activate()
        this.state = {
            recording: false,
        }
        this.requestStoragePermission()

        RNFetchBlob.fs.isDir(podwareCameraDir)
        .then(isDir => {
            if(!isDir) {
                RNFetchBlob.fs.mkdir(podwareCameraDir)
                .then(() => {
                    console.log('successfully created ' + podwareCameraDir)
                })
                .catch((err) => {
                    console.log('error creating ' + podwareCameraDir)
                    console.log(err)
                })
            }
            else {
                console.log(podwareCameraDir + ' already exists')
            }
        })
    }

    componentWillMount() {
        StatusBar.setHidden(true)
    }

    componentDidMount() {
        socket.emit('cameraConnected', device)
        socket.on('queryCamera', () => socket.emit('cameraConnected', device))
        socket.on('capture', () => this.takePicture())
        socket.on('startRecording', (timestamp) => {
            console.log('video started recording on ' + device)
            this.startRecording(timestamp)
        })
        socket.on('stopRecording', () => {
            this.camera.stopRecording()
        })
    }

    takePicture = async function() {
        if (this.camera) {
            const options = {
                quality: 0.5,
                base64: true
            }
            this.camera.takePictureAsync(options)
            .then((data) => {
                console.log(data.uri);
            })
        }
    }

    startRecording = async function(timestamp) {
        if(this.camera) {
            const options = {
                mute: true,
            }
            this.setState({recording: true})
            socket.emit('toggleCameraRecording',device)
            this.camera.recordAsync(options)
            .then((data) => {
                const endTime = Date.now()
                this.setState({recording: false})
                socket.emit('toggleCameraRecording',device)
                const pullFilePath = podwareCameraDir + timestamp + '_' + device + '.mp4'
                RNFetchBlob.fs.cp(data.uri, pullFilePath)
                .then(() => socket.emit('videoReadyToPull', {device,pullFilePath,timestamp,endTime}))
                .catch((err) => {
                    console.log('ERROR copying file from cache')
                    console.log(err)
                })
            })
            .catch(error => {
                const endTime = Date.now()
                this.setState({recording: false})
                socket.emit('toggleCameraRecording',device)
                const pullFilePath = podwareCameraDir + timestamp + '_' + device + '.mp4'
                RNFetchBlob.fs.cp(data.uri, pullFilePath)
                .then(() => socket.emit('videoReadyToPull', {device,pullFilePath,timestamp,endTime,error}))
                .catch((err) => {
                    console.log('ERROR copying file from cache')
                    console.log(err)
                })
            })
        }
    }

    requestStoragePermission = async function() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    'title': 'Storage Permission',
                    'message': 'podware-camera needs yout permission to access this device\'s storage'
                }
            )
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('You can use this device\'s storage')
            } else {
                console.log('go to app settings for podware-camera and allow storage permission')
            }
        } catch (err) {
            console.warn(err)
        }
    }

    render() {
        return (
            <View style={this.state.recording ? styles.recording : styles.notRecording}>
                <RNCamera
                    ref={cam => { this.camera = cam }}
                    style={styles.preview}
                    permissionDialogTitle={'Permission to use camera'}
                    permissionDialogMessage={'We need your permission to use your camera phone'}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    recording: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'black',
        borderWidth: 5,
        borderColor: '#f00'
    },
    notRecording: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'black',
        borderWidth: 5,
        borderColor: '#0f0'
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
});
