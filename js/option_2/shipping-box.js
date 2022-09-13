define([
    'jquery',
    'Magento_Ui/js/modal/alert',
    'Magento_Ui/js/modal/confirm',
    'mage/translate'
], function($, alert, confirm, $t){
    'use strict';

    return {
        'Commercers_OrderManagement/js/shipping-box': function (data) {
            var self = this;
            $('#carrier-dropdown-select').change(function() {
                self.reactOnCarrierDropdownSelect($(this).val());
            });
            $('.shipping-dropdown-select').change(function() {
                self.reactOnShippingDropdownSelect($(this).val(), data.current_shipping_price);
            });
            $('#label-count-input').change(function() {
                self.reactOnLabelCountSelect($(this).val());
            });
            //also add "save everything" functions
            $('#proove-checkbox').change(function () {
                var elem = $(this);
                self.ajaxSaveEverythingByCheckbox(elem, data.is_cash_on_delivery, data.update_url, data.order_id);
            });
        },
        reactOnCarrierDropdownSelect: function (value) {
            //hide all dropdowns
            var allDropdowns = $('.shipping-dropdown');
            allDropdowns.each(function () {
                var elem = $(this);

                elem.hide();
            });
            //show the desired dropdown
            $('.shipping-dropdown.' + value).show();

            var desiredSpans = $('.field-price-change-span');
            desiredSpans.each(function () {
                var elem = $(this);

                elem.html('-');
                elem.removeClass('no-display');
                elem.removeClass('higher');
                elem.removeClass('lower');
                elem.addClass('no-display');
            });
            var desiredSelects = $('.carrier-shipping-methods select');
            desiredSelects.each(function () {
                var elem = $(this);

                elem.val("0");
            });
        },
        reactOnShippingDropdownSelect: function (value, currentShippingPrice) {
            //update the price difference
            var desiredOption = $('.carrier-shipping-methods select option[value=\'' + value + '\']');
            var newPriceDifference = '-';

            if (desiredOption !== null) {
                var dataPrice = parseFloat(desiredOption.attr('data-price'));
                //use built in currency formatter
                newPriceDifference = new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(currentShippingPrice - dataPrice);
            }

            //update text at all spans
            var desiredSpans = $('.field-price-change-span');
            desiredSpans.each(function () {
                var elem = $(this);
                elem.html(newPriceDifference);
                //also update or remove classes for display purposes
                elem.removeClass('no-display');
                elem.removeClass('higher');
                elem.removeClass('lower');
                if (newPriceDifference === '-') {
                    //hide field
                    elem.addClass('no-display');
                } else if (currentShippingPrice - dataPrice > 0) {
                    //green
                    elem.addClass('higher');
                } else {
                    //red
                    elem.addClass('lower');
                }
            });
        },
        reactOnLabelCountSelect: function (value) {
            var allFields = $(".tracking-id-field");
            allFields.each(function () {
                var elem = $(this);
                elem.hide();
            });
            //count up to the value and show divs
            for (var i = 1; i <= parseInt(value); i++) {
                $(".tracking-id-field.field-" + i).show();
            }
        },
        ajaxSaveEverythingByCheckbox: function (elem, isCashOnDelivery, updateUrl, order_id) {
            var self = this;
            //alert, when not entered a value in 4M# when cash on delivery
            if (isCashOnDelivery === true) {
                var finance4mNumber = $('#finance-4m-number');
                if(isCashOnDelivery && finance4mNumber && finance4mNumber.val().length < 1) {
                    alert({
                        content: "Bitte füllen Sie stets das Feld 4M# für Nachnahmesendungen aus."
                    });
                    elem.prop('checked',false);
                    return;
                }
            }
            //alert when dhl id is chosen but not with concrete value
            var carrierValue = $('#carrier-dropdown-select').val();
            var shippingMethodValue = $('#shipping-dropdown-select-dhl').val();

            if (carrierValue === 'dhl' && (shippingMethodValue === 'DHL_agecheck_cod' || shippingMethodValue === 'DHL_agecheck_standard')) {
                var approvalAgeOverrideSelectValue = $('#approval-age-override-select').val();
                if (approvalAgeOverrideSelectValue === '0') {
                    alert({
                        content: "Bitte verwenden Sie nicht den Wert '0' für das Feld 'Benötigtes Alter ändern auf:' bei DHL ID Prüfungen. Bzw. wenn die Bestellung keine FSK Artikel enthält und dennoch per ID Prüfung versandt werden soll, wählen Sie bitte das entsprechende Alter das verifiziert werden soll."
                    });
                    elem.prop('checked',false);
                    return;
                }
            }

            if (elem.is(":checked")) {
                //save stuff
                confirm({
                    content: "Wirklich auf Versendet setzen",
                    buttons: [
                        {
                            text: $t('OK'),
                            class: 'action-primary action-accept',
                            click: function (event) {
                                self.ajaxSaveEverything(true, elem, updateUrl, order_id);
                                this.closeModal(event, true);
                            }
                        },
                        {
                            text: $t('Abbrechen'),
                            class: 'action-secondary action-dismiss',
                            click: function (event) {
                                this.closeModal(event, true);
                            }
                        }
                    ]
                });
            } else {
                //enable all fields
                self.enableDisableFields(true);

                elem.parent().removeClass('working');
                elem.parent().removeClass('error');
                elem.parent().removeClass('success');
                elem.parent().addClass('std');
            }
        },
        ajaxSaveEverything: function(saveInvokedFromCheckbox, checkboxElement, updateUrl, order_id) {
            var self = this;
            //gather information
            var fields = $('.shipping-box-wrap').find('select, input:not(#proove-checkbox)');
            var dataObject = {};

            //go through every field and grab value
            fields.each(function(){
                dataObject = self.saveEverythingGrabValue($(this), dataObject);
            });

            //grab field update span yet
            var dataStatusLabel;
            if (saveInvokedFromCheckbox === true) {
                //set statuslabel as checkbox element itself
                dataStatusLabel = checkboxElement.parent();
            } else {
                //grab status adjacent label
                dataStatusLabel = $('#ajax-save-everything-button+.field-status-span');
            }

            $.ajax({
                url : updateUrl,
                data : {
                    order_id: order_id,
                    is_save_everything: true,
                    complete_data: JSON.stringify(dataObject)
                },
                type : 'post',
                dataType : 'json',
                showLoader: true,
                success: function (json) {
                    if (json.success) {
                        //hide every checkmark at those buttons
                        if (!saveInvokedFromCheckbox) {
                            dataStatusLabel.html('&checkmark;');
                        }
                        dataStatusLabel.removeClass('working');
                        dataStatusLabel.addClass('success');
                        //alert save errors
                        if (json.save_errors !== null) {
                            var alertErrors = false;
                            var errors = '[';
                            for (var key in json.save_errors) {
                                if (!json.save_errors.hasOwnProperty(key)) continue;
                                alertErrors = true;
                                errors += "Key:" + key + '-Value:' + json.save_errors[key] + ",\n";
                            }
                            errors += ']';
                            if (alertErrors) {
                                alert({
                                    content: "There were errors! Please try again later: " + errors
                                });
                            }
                        }
                        //when invoked from cehckbox, we should deaktivate all fields
                        if (saveInvokedFromCheckbox) {
                            self.enableDisableFields(false);
                            //when there was a change in carrier dropdown -> disable position export
                            if (json.shipping_override_changed === true) {
                                var elems = $('p.form-buttons .position-export-4master');
                                //there may be two buttons, because the "hidden one" will shop up when scrolled down
                                elems.each(function(){
                                    var btnElem = $(this);
                                    btnElem.addClass('disabled');
                                    btnElem.attr('disabled','disabled');
                                    btnElem.attr('title', 'Die Liefermethode wurde geändert, bitte laden Sie die Seite neu um Positionen zu exportieren.');
                                });
                            }
                        }
                    } else {
                        //assume we have an error
                        if (!saveInvokedFromCheckbox) {
                            dataStatusLabel.html('&Omega;');
                        }
                        dataStatusLabel.removeClass('working');
                        dataStatusLabel.addClass('error');
                        alert({
                            content: json.message
                        });
                    }
                },
                error: function () {
                    if (!saveInvokedFromCheckbox) {
                        dataStatusLabel.html('&Omega;');
                    }
                    dataStatusLabel.removeClass('working');
                    dataStatusLabel.addClass('error');
                    alert({
                        content: "There was an unknown error, please contact the developer."
                    });
                }
            });
        },
        enableDisableFields: function(enable){
            var shippingBox = $('.shipping-box-wrap');
            if(enable) {
                shippingBox.find('select').removeAttr('disabled');
                shippingBox.find('input:not(#proove-checkbox)').removeAttr('disabled');
            } else {
                shippingBox.find('select').attr('disabled','disabled');
                shippingBox.find('input:not(#proove-checkbox)').attr('disabled','disabled');
            }
        },
        saveEverythingGrabValue: function(field, currentObject) {
            var node = null;
            var fieldName = field.attr('id');

            if(fieldName.indexOf('shipping-dropdown') !== -1) {
                fieldName = 'shipping-dropdown';
            }

            switch (fieldName) {
                case "shipping-dropdown":
                    //grab value in respect of carrier field
                    if (currentObject['carrier-dropdown-select'] !== '0') {
                        node = $('.' + fieldName + '.' + currentObject['carrier-dropdown-select'] + ' select');
                        if (node !== null && node.val() !== undefined) {
                            //becasue we dont care in backend, which drodpwn was used -> set data to the first select
                            currentObject['shipping-dropdown-select-1'] = node.val();
                        }
                    }
                    break;
                case "no-label-print":
                case "bulky-goods":
                    //checkbox values
                    currentObject[fieldName] = field.is(":checked");
                    break;
                case "dangerous-goods":
                    //checkbox values
                    currentObject[fieldName] = field.is(":checked");
                    break;
                default:
                    //grab everything that will definitly match and doesnt require a previous field
                    if (field !== null) {
                        currentObject[fieldName] = field.val();
                    }
                    break;
            }

            return currentObject;
        }
    }
});