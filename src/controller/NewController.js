/**
 * Created by aswasn on 2016/12/18.
 */

// import js modules
import BaseController from './BaseController';

// import css
require('../css/new.css');


/**
 * NewController处理new.html的各种逻辑
 */
class NewController extends BaseController {

    static newInstance() {
        return new NewController();
    }
}


// run
$(document).ready(() => {
    NewController.newInstance();
});
