define([
    'jquery',
    'Magento_Ui/js/modal/confirm',
    'Magento_Ui/js/modal/alert',
    'mage/translate'
], function ($, confirm, alert, $t) {
    'use strict';
    $.widget(
        'mage.ordermanagement',
        {
            _create: function () {
                var self = this;
                var options = self.options;
                this.approvalMailsInit(options);
                this.approvalCommentInit(options);
            },
            approvalMailsInit: function (options) {
                var orderId = options.order_id;
                var customerId = options.customer_id;

                $('.ajax-approvalmails-button').click(function (e) {
                    e.preventDefault();

                    var refId = $(this).attr('data-ref-id');
                    var comment = $('#approvalmails-comment-for-customer').val();

                    confirm({
                        content: $t('Nachricht wirklich senden?'),
                        actions: {
                            confirm: function () {
                                $.ajax({
                                    url : options.send_approvalmail_url,
                                    data : {
                                        referrer_id: "ordermanagement_admin",
                                        customer_id: customerId,
                                        button_id: refId,
                                        order_id: orderId,
                                        comment: comment
                                    },
                                    type : 'post',
                                    dataType : 'json',
                                    showLoader: true,
                                    success: function (response) {
                                        alert({
                                            content: response.message
                                        });
                                    }
                                });
                            }
                        }
                    });
                });
            },
            approvalCommentInit: function (options) {
                $('.approval-comment-save').click(function (e) {
                    e.preventDefault();

                    var comment = $('#approval-documents-comment').val();

                    $.ajax({
                        url : options.save_approval_comment_url,
                        data : {
                            referrer_id: "approval_admin",
                            approval_id: options.approval_id,
                            comment: comment
                        },
                        type : 'post',
                        dataType : 'json',
                        showLoader: true,
                        success: function (response) {
                            if(response.success) {
                                alert({
                                    content: response.message
                                });
                            }
                        }
                    });

                });
            }
        }
    );
    return $.mage.ordermanagement;
});
