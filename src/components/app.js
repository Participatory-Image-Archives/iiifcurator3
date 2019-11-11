import React, { Component } from 'react'
import { render } from 'react-dom'
import { connect } from 'react-redux'
import ReactJson from 'react-json-view'
import {CopyToClipboard} from 'react-copy-to-clipboard'
import styles from '../hard.module.css'
import InputManifest from './InputManifest.js'
import InputCollectionHead from './InputCollectionHead.js'
import InputCollection from './InputCollection.js'
import JsonOut from './JsonOut.js'
import ItemList from './ItemList.js'
import store from '../store'


class App extends Component {

    constructor(props) {
        super(props)
        const state = store.getState()
        this.callbackLoadCollection('https://iiif.manducus.net/collections/random/autumn.json')
        this.rebuildCollectionV2 = this.rebuildCollectionV2.bind(this)
        this.rebuildCollectionV2(state.items)
    }

    componentDidMount() {
        const state = store.getState()
        for (const uri of state.items) {
            this.enrich_view(uri)
        }
        this.rebuildCollectionV2(state.items)
    }

    enrich_view(uri) {
        fetch(uri)
            .then(res => res.json())
            .then((data) => {
                const state = store.getState()
                store.dispatch({type: 'ENRICH_VIEW',
                    uri: uri,
                    label: data.label,
                    thumb: data['sequences'][0]['canvases'][0]['images'][0]['resource']['service']['@id']+'/full/200,/0/default.jpg'
                })
                this.rebuildCollectionV2(state.items)
            })
            .catch(console.log)
    }

    callbackSwapItems = (childData) => {
        this.rebuildCollectionV2(childData)
    }

    rebuildCollectionV2(tempitems) {
        console.log("rebuildCollectionV2")
        const state = store.getState()
        var tempv2 = state.v2
        tempv2['manifests'] = []
        for(const key in tempitems) {
            let tm = {}
            tm['@id']=tempitems[key]
            tm['@type']='sc:Manifest'
            tm['label']=state.labels[tempitems[key]]
            tempv2['manifests'].push(tm)
        }
        var tempv2json = JSON.stringify(tempv2, null, 2)
        store.dispatch({type:'SET_IIIF',v2: tempv2})
        store.dispatch({type:'SET_IIIFJSON',v2json: tempv2json})
    }

    callbackRemoveItem = (uri) => {
        console.log("remove click! "+uri)
        store.dispatch({type: 'REMOVE_MANIFEST',uri: uri })
        const state = store.getState()
        var tempitems = state.items
        this.rebuildCollectionV2(tempitems)
        // this.forceUpdate()
    }

    callbackAddItem = (uri) => {
        const state = store.getState()
        if(state.items.includes(uri)) {
            alert("already there")
            return
        }
        store.dispatch({type: 'ADD_MANIFEST', uri: uri })
        this.enrich_view(uri)
        this.rebuildCollectionV2(state.items)
    }

    callbackUpdateCollection = () => {
        const state = store.getState()
        var tempv2 = state.v2
        tempv2['@id']=state.uri
        tempv2['label']=state.label
        const ordered = {}
        Object.keys(tempv2).sort().forEach(function(key) {
            ordered[key] = tempv2[key]
        })
        var tempv2json = JSON.stringify(tempv2, null, 2)
        store.dispatch({type:'SET_IIIFJSON',v2json: tempv2json})
        store.dispatch({type:'SET_IIIF',v2: ordered})
    }

    callbackLoadCollection = (uri) => {
        fetch(uri)
            .then(res => res.json())
            .then((data) => {
                var labels = []
                var thumbs = []
                var items = []
                for(const m of data['manifests']) {
                    items.push(m['@id'])
                    this.enrich_view(m['@id'])
                    labels[m['@id']]="<title>"
                    thumbs[m['@id']]="logo192.png"
                }
                store.dispatch({type: 'LOAD_COLLECTION',data: {
                    label: data['label'],
                    uri: data['@id'],
                    items: items,
                    labels: labels,
                    thumbs: thumbs
                }})
                this.callbackUpdateCollection()
                this.rebuildCollectionV2(items)
            })
            .catch(console.log)
    }

    render() {
        const state = store.getState()
        return (
            <div className={styles.gridwrap}>
                <div className={styles.headleft}>
                    <InputCollection loadCallback={this.callbackLoadCollection} />
                    <InputManifest addCallback={this.callbackAddItem} />
                </div>
                <div className={styles.headright}>
                    <InputCollectionHead updateCallback={this.callbackUpdateCollection} />
                    <CopyToClipboard text={state.v2json}>
                      <button>COPY</button>
                    </CopyToClipboard>
                </div>
                <div className={styles.gridleft}>
                    <ItemList swapCallback={this.callbackSwapItems} removeCallback={this.callbackRemoveItem} />
                </div>
                <div className={styles.gridright}>
                    <JsonOut />
                </div>
            </div>
        )
    }
}

export default connect()(App)
