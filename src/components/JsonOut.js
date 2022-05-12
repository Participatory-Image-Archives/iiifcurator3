import React, { Component } from 'react';
import { connect } from 'react-redux';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';
import styles from '../hard.module.css';

class JsonOut extends Component {
    render() {
        return (
            <div className={styles.jsonout}>
                <JSONPretty id="json-pretty" data={this.props.v3json}></JSONPretty>
            </div> );
    }
}

function mapStateToProps(state, ownProps) {
    return {
        v3json: state.v3json,
        v3: state.v3,
    };
}

export default connect(mapStateToProps)(JsonOut)
