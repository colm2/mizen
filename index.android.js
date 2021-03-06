/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  DeviceEventEmitter,
  Alert
} from 'react-native';
import Beacons from 'react-native-beacons-manager';

import { createStore } from 'redux';
import { connect, Provider } from 'react-redux';

import Tabs from './Components/Tabs';
import SplashScreen from './Components/SplashScreen';

import store from './store';

async function establishBeacons(){
  Beacons.detectIBeacons(); // Android only fn
  //Beacons.requestWhenInUseAuthorization(); // ios only fn

  const region = {
    identifier: 'WGB',
    uuid: 'EBD21AB7-C471-770B-E4DF-70EE82026A17'
  };

  try {
    await Beacons.startRangingBeaconsInRegion(region.identifier, region.uuid);
    console.log(`Beacons ranging started successfully`);
  } catch (error) {
    console.log(`Beacons ranging not started, error: ${error}`);
  }

  // Update app state with ordered detected beacons
  // whenever beacons range
  DeviceEventEmitter.addListener('beaconsDidRange', (data) => {
    if(data.beacons.length > 0){
      function compare(a,b) { //by distance
        if (a.distance < b.distance)
          return -1;
        if (a.distance > b.distance)
          return 1;
        return 0;
      }

      data.beacons.sort(compare);
      store.dispatch({type:'BEACONS_UPDATE', beacons:data.beacons});
    }
  });
}
establishBeacons();

ready = false;

async function getProjectsFromAPI() {
  let response = await fetch('https://colmfyp.netsoc.co/projects.json');
  let data = await response.json();
  return data;
}

async function initProjects(){
  try{
    // Change this, but note - JSON endpoint MUST BE HTTPS!
    let data = await getProjectsFromAPI();

    // Get saved projects from storage
    s = await AsyncStorage.getItem('savedProjects');
    // if nothing found, use empty array instead
    s = s === null ? [] : JSON.parse(s);

    //repeat
    d = await AsyncStorage.getItem('doneProjects');
    d = d === null ? [] : JSON.parse(d);

    //update state
    store.dispatch({type:'PROJECTS_UPDATE', projects:data.projects});
    store.dispatch({type:'ROOMS_UPDATE', rooms:data.rooms});

    ready = true;
  } catch(error) {
    Alert.alert(
      'Network Error',
      'There\'s been an issue downloading event information. Make sure you\'re connected to the internet and try again.',
      [
        {text: 'Try Again', onPress: () => initProjects()},
      ],
      { cancelable: false }
    );
  }
}
initProjects();

export default class Mizen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    setTimeout(() => this.readyCheck(), 250); // Keep checking until it is!
  }

  readyCheck(){
    this.setState({ready: ready});
    if(!this.state.ready){
      setTimeout(() => this.readyCheck(), 250);
    }
  }

  render() {
    if(this.state.ready){
      return (
        <Tabs store={store} />
      );
    } else {
      return(<SplashScreen />);
    }
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('Mizen', () => Mizen);