jQuery(document).ready(function ($) {

    //$("#admin-list-item ")
    var form_admin = '.zt-form';
    //binding daterange picker
    datetimepicker();

    //CheckAll and UncheckAll
    cbAll(form_admin + ' .cbAll', ".cbx");

    change_form_action(form_admin + ' .slbAction', form_admin);
    check_file_type();

    if (typeof checkOption !== 'undefined') {
        check_form_ajax(checkOption);
    }
    if (typeof checkOptionInfo !== 'undefined') {
        check_form_ajaxProfile(checkOptionInfo,'.z-form-input-info');
    }
    if (typeof checkOptionPass !== 'undefined') {
        check_form_ajaxProfile(checkOptionPass,'.z-form-input-pass');
    }

    // fix input type number can press 'e' character
    $('input[type="number"]').keypress(function(e) {
        if(e.keyCode == 101 || e.keyCode == 69)
        {
          return false;
        }
    });

    /*===========================================================
    * Thêm hoặc chỉnh sửa một record
     *==========================================================*/
    function check_form_ajax(checkOption) {

        // console.log("check_form_ajax");
        var selector = checkOption.selector;
        var post_url = checkOption.post_url;
        var class_form = checkOption.class_form;
        var action_name = checkOption.action_name;
        var msg_status = checkOption.msg_status;
        var class_error = checkOption.class_error;
        var data_type = checkOption.data_type;


    	// console.log(selector);
        $(selector).on("click", function () {
            // Xóa các thông báo của form - Hàm này nằm trong tập tin support.js
            zcms_error_empty(class_error, msg_status);
            $.ajax({
                method: 'POST',
                url: post_url,
                data: $(class_form).serialize(),
                dataType: data_type,
                /*
                 * nếu lỗi trong việc gửi biến ajax hãy sử dụng option
                 * error này để kiểm tra
                 */

                error: function (data) {
                    console.log(data);
                }
            }).done(function (result) {
                console.log(result);
                if (result.status == 'error') {
                    var msgObj = result.msg;

                    $.each(msgObj, function (index, value) {
                        var msg_name = ".msg-" + index;

                        $(class_form + " " + msg_name).html(value);
                    });

                    zcms_error_show(class_error);

                }
                else {
                	$(class_form).submit();
                }
            });
        });
    }

    function check_form_ajaxProfile(checkOption, classForm) {

        // console.log("check_form_ajax");

        var selector = checkOption.selector;
        var post_url = checkOption.post_url;
        var class_form = checkOption.class_form;
        var action_name = checkOption.action_name;
        var msg_status = checkOption.msg_status;
        var class_error = checkOption.class_error;
        var data_type = checkOption.data_type;

        $(selector).on("click", function () {


            console.log('ewewq');
            // Xóa các thông báo của form - Hàm này nằm trong tập tin support.js
            zcms_error_empty(class_error, msg_status);
            $.ajax({
                method: 'POST',
                url: post_url,
                data: $(class_form).serialize(),
                dataType: data_type,
                /*
                 * nếu lỗi trong việc gửi biến ajax hãy sử dụng option
                 * error này để kiểm tra
                 */

                error: function (data) {
                    console.log(data);
                }
            }).done(function (result) {
                console.log(result);
                //alert(result);

                if (result.status == 'error') {
                    // Check selectbox on chosing or not
                    $(classForm + ' select').each(function () {
                        if ($(this).val() == 0) {
                            $(this).parent().children('.error').text('Bạn chưa chọn giá trị này').css('display', 'block');
                        }
                        else {
                            $(this).parent().children('.error').css('display', 'none');
                        }
                    });

                    picture_empty('.fileinput-filename', '.fileinput+.error');

                    var msgObj = result.msg;

                    $.each(msgObj, function (index, value) {
                        var msg_name = ".msg-" + index;

                        $(class_form + " " + msg_name).html(value);
                    });

                    zcms_error_show(class_error);

                }
                else {
                    // Kiểm tra các selectbox đã được ấn hay chưa
                    var flag = false;
                    $(classForm + ' select').each(function () {
                        console.log($.contains($(this).parent(), ('.error')));
                        if ($.contains($(this).parent(), ('.error'))) {
                            if ($(this).val() == 0) {
                                $(this).parent().children('.error').text('Bạn chưa chọn giá trị này').css('display', 'block');
                                flag = true;
                            }
                            else {
                                $(this).parent().children('.error').css('display', 'none');
                            }
                        }
                    });
                    flag = picture_empty('.fileinput-filename', '.fileinput+.error');
                    console.log(flag);
                    if (flag == false) {
                        $(class_form).submit();
                    }
                    else {
                        $(this).parent().children('.error').css('display', 'none');
                        console.log($(this));
                    }
                }
            });
        });
    }

    /*
     * =========================================================== 4. Function:
     * Kiểm tra hình có được ấn hay chưa
     *
     * Ex: picture_empty('.fileinput-filename', $('.fileinput').parent());
     *
     * @param: Tên class input để kiểm tra
     *
     * @param: Tên class để hiện thông báo error
     * ==========================================================
     */
    function picture_empty(file_input_name, $place_append_error_text) {
        if ($(file_input_name).length == 0) {
            return false;
        }
        if ($(file_input_name).text() == '') {
            $($place_append_error_text).text('Bạn chưa chọn hình ảnh nào').css('display', 'block');
            return true;
        }
        else {
            $($place_append_error_text).css('display', 'none');
            return false;
        }
    }


    /*===========================================================
     * 4. Binding datetimepicker
     *
     *==========================================================*/

    function datetimepicker() {

        $('input.datetime').daterangepicker(
            {
            	'timePicker': true,
                'timePicker24Hour': true,
                'timePickerSeconds': true,
                'timePickerIncrement': 1,
                'locale': {
                    'format': 'MM/DD/YYYY HH:mm:ss',
                    'cancelLabel': 'Clear'
                }
            });
    }

    /*===========================================================
     * 3. Function: Xóa nội dung và ẩn đi các thông báo lỗi
     *
     * Ex: zcms_error_empty(".form-add .error",".msg-status");
     *
     * @param: Tên class hiển thị thông báo error
     * 			của các phần tử input trong form
     * @param: Tên class của phẩn tử chứa thông báo error
     *==========================================================*/
    function zcms_error_empty(selector_error, selector_status) {
        $(selector_error).each(function (index, value) {
            $(this).html('').hide();
        });

        $(selector_status).hide();
    }

    /*===========================================================
     * 2. Hiển thị error
     *
     * Ex: zcms_error_show(".form-add .error");
     *
     * @param: Tên class của phẩn tử chứa thông báo error
     *==========================================================*/

    function zcms_error_show(selector) {
        $(selector).each(function (index, value) {
            if ($(this).html() != '') $(this).show();
        });
    }


    /*===========================================================
     * 4. Hàm kiểm tra phần mở rộng của file upload
     * khi sử dụng jasny-bootstrap
     *==========================================================*/
    function check_file_type(selector = '.fileinput') {

        $(selector).on('change.bs.fileinput', function (e, files) {

            //Lấy phần tử chứ tên của tập tin
            var file_name = $(this).find('.fileinput-filename');

            //lấy giá trị trong thuộc tính data-file-ext của phần tử HTML
            var file_exts_str = $(this).attr('data-file-ext');

            //
            var file_ext = file_exts_str.split(',');

            //Kiểm tra
            var check_file = check_file_ext(file_name, file_ext);
            if (check_file == false) {
                $(selector).fileinput('clear');
            }

        });
    }

    function check_file_ext(file_name, file_ext) {
        var flag = true;
        var ext = $(file_name).text().split('.').pop().toLowerCase();
        if ($.inArray(ext, file_ext) == -1) {
            alert('invalid extension!');
            flag = false;
        }

        return flag;
    }


    /*===========================================================
     * 3. Hàm chuyển giá trị của Selectbox cho Form action
     *==========================================================*/
    function change_form_action(slb_selector, form_selector) {

        var optValue;

        $(slb_selector).on("change", function () {
            optValue = $(this).val();

            $(form_selector).attr("action", optValue);

            console.log($(form_selector));
            console.log($(this).val());
        })

        $(form_selector + " .btnAction").on("click", function () {
            var numberOfChecked = $(form_selector + ' input[name="cb[]"]:checked').length;
            if (numberOfChecked == 0) {
                alert("Please choose some items");
                return;
            } else {
                var flag = false;

                var str = $(slb_selector + " option:selected").attr('data-comfirm');

                console.log(str);

                if (str != undefined) {

                    //Kiểm tra giá trị trả về khi user nhấn nút trên popup
                    flag = confirm(str);
                    if (flag == false) {
                        return flag;
                    } else {
                        $(form_selector).submit();
                    }

                } else {
                    //console.log(optValue);
                    if (optValue != undefined) {
                        $(form_selector).submit();
                    }
                }

                //console.log(flag);


            }

        });
    }

    /*===========================================================
     * 2. Hàm Move to Trash
     *==========================================================*/
    function change_status(selector) {

        $(selector).on("click", function () {

            var action_url = $(this).attr("data-url");
            console.log(action_url);

            console.log($(this).closest("tr").attr("data-id"));
            $(this).closest("tr").remove();

            $.ajax({
                method: "GET",
                url: action_url,
                dataType: 'html',
                success: function (data) {
                    $(".ajax-debug").append(data);
                    //console.log(data);
                }
            });
        });


    }

    /*===========================================================
     * 1. Hàm giúp checkAll và unCheckAll
     *==========================================================*/
    function cbAll(selector_1, selector_2) {

        $(selector_1).on("change", function () {
            $(selector_2 + ':not([disabled])').prop("checked", $(this).prop("checked"));
        });
    }

    /*===========================================================
     * Load district base on city
     *==========================================================*/
    $('#city_id').on("change", function () {
        var action_url = $(this).attr("data-url") + $(this).val();
        var city_id = $(this).val();
        $.ajax({
            method: "GET",
            url: action_url,
            dataType: 'html',
            success: function (data) {
                $('#district_container').html(data);
            }
        });
    });

    /*
     * =========================================================== Affiliate
     * Clipboard ==========================================================
     */
    var clipboard = new Clipboard('button.clipboard');

});

//Notify messages
function loadToastr(status, msg) {

    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "rtl": false,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": 300,
        "hideDuration": 1000,
        "timeOut": 5000,
        "extendedTimeOut": 1000,
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

    if (status == 1) {
        toastr.success(msg, 'Success');
    } else {
        toastr.error(msg, 'Error');
    }
}
