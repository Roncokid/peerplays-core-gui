/*
 * Copyright (c) 2015 Cryptonomex, Inc., and contributors.
 *
 * The MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import {
    CLAIM_BTS_SET_STATUS,
    CLAIM_BTS_SET_ERRORS
} from "../constants/ActionTypes";

import {key, PrivateKey} from "peerplaysjs-lib";
import counterpart from "counterpart";
import AccountRepository from "../repositories/AccountRepository";
import LoginService from '../services/LoginService';
import NavigateActions from "../actions/NavigateActions";

/**
 * Private Redux Action Creator (CLAIM_BTS_SET_STATUS)
 *
 * button Status
 *
 * @param {string} status - loading|default
 * @returns {{type, payload: {status: *}}}
 */
function setStatus(status) {
    return {
        type: CLAIM_BTS_SET_STATUS,
        payload: {
            status: status
        }
    }
}
/**
 * Private Redux Action Creator (CLAIM_BTS_SET_ERRORS)
 * ClaimBtsForm: common errors
 * @param {array} errors
 * @returns {{type, payload: {errors: []}}}
 */
function setErrors(errors) {
    return {
        type: CLAIM_BTS_SET_ERRORS,
        payload: {
            errors: errors
        }
    }
}

class ClaimBtsActions {

    /**
     * Change button Status
     *
     * @param status
     * @returns {{type, payload: {status: *}}}
     */
    static setStatus(status) {
        return setStatus(status);
    }

    /**
     * Login bts account by private key
     *
     * @param {string} private_bts_key
     * @returns {function(*=)}
     */
    static loginAccountFromBts(private_bts_key) {
        return (dispatch) => {

            let privateKey = PrivateKey.fromWif(private_bts_key),
                publicKey = privateKey.toPublicKey().toPublicKeyString();

            AccountRepository.getAccountRefsOfKey(publicKey).then((accountIds) => {

                let accountsPromises = [];

                if (accountIds && accountIds.length) {

                    accountIds.forEach((accountId) => {
                        accountsPromises.push(AccountRepository.fetchFullAccount(accountId));
                    });

                    return Promise.all(accountsPromises)

                } else {
                    return [];
                }

            }).then((results) => {

                let findResult = results.find((result) => {

                    let keysNames = ['owner', 'active'];

                    let isLogin = false;

                    for (let i = 0; i < keysNames.length; i++) {

                        let userKey = keysNames[i];

                        if (result && result[1] && result[1]['account'] && result[1]['account'][userKey]['key_auths'] && result[1]['account'][userKey]['key_auths'].length) {

                            let findResult = result[1]['account'][userKey]['key_auths'].find((keyArr) => {
                                return keyArr[0] && keyArr[0] === publicKey;
                            });

                            if (findResult) {
                                isLogin = true;
                            }

                        }
                    }

                    return isLogin;
                });

                if (findResult) {

                    let account = findResult[1]['account'];

                    return LoginService.systemLoginByPrivateKey(account, private_bts_key, dispatch).then(() => {

                        dispatch(NavigateActions.navigateToDashboard());
                        dispatch(setStatus('default'));

                    }).catch(() => {
                        dispatch(setStatus('default'));
                    });

                } else {
                    dispatch(setErrors([counterpart.translate('errors.incorrect_private_key')]));
                    dispatch(setStatus('default'));
                }


            }).catch((err) => {
                console.warn('Error:', err);
                dispatch(setErrors([counterpart.translate('errors.incorrect_private_key')]));
                dispatch(setStatus('default'));
            });

        }

    }

}

export default ClaimBtsActions;