import React, { Component } from 'react'
import { render } from 'react-dom'
import { connect } from 'react-redux'
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
        this.callbackLoadCollection('https://raw.githubusercontent.com/Participatory-Image-Archives/pia-data-model/main/iiif/boilerplates/collection_boilerplate_empty.json')
        this.rebuildCollectionv3 = this.rebuildCollectionv3.bind(this)
        this.rebuildCollectionv3(state.items)
    }

    componentDidMount() {
        const state = store.getState()
        for (const uri of state.items) {
            this.enrich_view(uri)
        }
        this.rebuildCollectionv3(state.items)
    }

    enrich_view(uri) {
        fetch(uri)
            .then(res => res.json())
            .then((data) => {
                const state = store.getState()
                if('label' in data) {
                    console.log(data.label)
                    var label = data.label.en[0];
                    /*if(typeof data.label == 'string') {
                        var label = data.label;
                    } else {
                        var label = data.label['@value'];
                    }*/
                } else {
                    var label = uri;
                }
                if('thumbnail' in data['items'][0]['items'][0]) {
                    var thumbnail = data['items'][0]['items'][0]['thumbnail'];
                } else {
                    var thumbnail = data['items'][0]['items'][0]['items'][0]['body']['service'][0]['id']+'/full/200,/0/default.jpg';
                }
                store.dispatch({type: 'ENRICH_VIEW',
                    uri: uri,
                    label: label,
                    thumb: thumbnail
                })
                this.rebuildCollectionv3(state.items)
            })
            .catch(console.log)
    }

    callbackSwapItems = (childData) => {
        this.rebuildCollectionv3(childData)
    }

    rebuildCollectionv3(tempitems) {
        console.log("rebuildCollectionv3")
        const state = store.getState()
        var tempv3 = state.v3
        tempv3['items'] = []
        for(const key in tempitems) {
            let tm = {}
            tm['id']=tempitems[key]
            tm['type']='Manifest'
            tm['label']=state.labels[tempitems[key]]
            tempv3['items'].push(tm)
        }
        var tempv3json = JSON.stringify(tempv3, null, 2)
        store.dispatch({type:'SET_IIIF',v3: tempv3})
        store.dispatch({type:'SET_IIIFJSON',v3json: tempv3json})
    }

    callbackRemoveItem = (uri) => {
        console.log("remove click! "+uri)
        store.dispatch({type: 'REMOVE_MANIFEST',uri: uri })
        const state = store.getState()
        var tempitems = state.items
        this.rebuildCollectionv3(tempitems)
        // this.forceUpdate()
    }

    callbackAddItem = (uriin) => {
        const state = store.getState()
        let uriarray = uriin.split(/[\s]+/)
        for(let uri of uriarray) {
          if(state.items.includes(uri)) {
              alert("already there")
              return
          }
          store.dispatch({type: 'ADD_MANIFEST', uri: uri })
          this.enrich_view(uri)
        }
        this.rebuildCollectionv3(state.items)
    }

    callbackUpdateCollection = () => {
        const state = store.getState()
        var tempv3 = state.v3
        tempv3['id']=state.uri
        tempv3['label']=state.label
        const ordered = {}
        Object.keys(tempv3).sort().forEach(function(key) {
            ordered[key] = tempv3[key]
        })
        var tempv3json = JSON.stringify(tempv3, null, 2)
        store.dispatch({type:'SET_IIIFJSON',v3json: tempv3json})
        store.dispatch({type:'SET_IIIF',v3: ordered})
    }

    callbackLoadCollection = (uri) => {
        fetch(uri)
            .then(res => res.json())
            .then((data) => {
                var labels = [], thumbs = [], items = [], id = '<empty>', label = '<empty>';

                if(data['id']) {
                    id = data['id']
                }
                if(data.label) {
                    label = data.label[Object.keys(data.label)][0]
                }

                for(const m of data['items']) {
                    items.push(m['id'])
                    this.enrich_view(m['id'])
                    labels[m['id']]="<title>"
                    thumbs[m['id']]="logo192.png"
                    if(items.length>100) {
                        alert("stopping at 100 items")
                        break
                    }
                }


                store.dispatch({type: 'LOAD_COLLECTION',data: {
                    label: label,
                    uri: id,
                    items: items,
                    labels: labels,
                    thumbs: thumbs
                }})
                this.callbackUpdateCollection()
                this.rebuildCollectionv3(items)
            })
            .catch(console.log)
    }

    render() {
        // const state = store.getState()
        return (
            <div className={styles.gridwrap}>
                <div className={styles.headleft}>
                    <button onClick={(e) => this.callbackLoadCollection('https://raw.githubusercontent.com/Participatory-Image-Archives/pia-data-model/main/iiif/boilerplates/collection_boilerplate_empty.json')}>
                    Load Empty Collection
                    </button>
                    <button onClick={(e) => this.callbackLoadCollection('https://iiif.participatory-archives.ch/collections/4.json')}>
                    Load Familie Kreis Collection (SGV_10)
                    </button>
                    <button onClick={(e) => this.callbackLoadCollection('https://iiif.participatory-archives.ch/collections/13.json')}>
                    Load Ernst Brunner Collection (SGV_12)
                    </button>
                    <InputCollection loadCallback={this.callbackLoadCollection} />
                    <InputManifest addCallback={this.callbackAddItem} />
                </div>
                <div className={styles.headright}>
                    <InputCollectionHead updateCallback={this.callbackUpdateCollection} />
                    <CopyToClipboard text={this.props.v3json}>
                      <button>COPY</button>
                    </CopyToClipboard>
                </div>
                <div className={styles.gridleft}>
                    <ItemList swapCallback={this.callbackSwapItems} removeCallback={this.callbackRemoveItem} />
                </div>
                <div className={styles.gridright}>
                    <JsonOut />
                    <p>Work in progress</p>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state, ownProps) {
    return {
        v3json: state.v3json
    };
}

export default connect(mapStateToProps)(App)
