/*
	摇一摇
	使用方法：
	qv.zero.Shake.start(function(){}); //设置摇动手机的时候 触发的函数
	qv.zero.Shake.goon();	//继续监听摇动事件
	qv.zero.Shake.stop();	//停止监听摇动事件
	qv.zero.Shake.pause();	//暂停监听摇动事件
	qv.zero.Shake.setShake(800);  //设置摇动的敏感度
*/

;(function(exports) {
	var SHAKE_THRESHOLD = 1000; //摇一摇频率 越大越不灵敏
	function DeviceMotionManager(){//摇一摇控制
        var last_x = 0, last_y = 0, last_z = 0, last_update = 0;
        var isstart = false, ispause = false, eventHandle = function(){};
        function checked(x, y, z){
            var curTime = +new Date(), diffTime;
            if(curTime - last_update > 100){
                diffTime = curTime -  last_update;
                last_update = curTime;
                var speed = Math.abs(x + y + z - last_x - last_y - last_z) / diffTime * 10000;

                if(speed > SHAKE_THRESHOLD){
                    return true;
                }
                last_x = x; last_y = y; last_z = z;
            }
            return false;
        }
        
        function devicemotionHandle(eventData){
            var acceleration = eventData.accelerationIncludingGravity;
            if(!ispause && checked(acceleration.x, acceleration.y, acceleration.z)) {
                ispause = true;
                eventHandle();
            }
        }

        function start(){                
            if (window.DeviceMotionEvent) {
                window.addEventListener('devicemotion', devicemotionHandle, false);
            } else {
                mqq.sensor.startAccelerometer(function (ret, x, y, z){
                    if(ret){
                        if(!ispause && checked(x, y, z)) {
                            ispause = true;
                            eventHandle();
                        }
                    } else {
                        zMsg.show('你的手机不支持摇一摇哦~');
                    }
                });
            }
        };

        return {
            stop : function(){
                try{
                    isstart && mqq.sensor.stopAccelerometer();
                    window.DeviceMotionEvent && window.removeEventListener('devicemotion', devicemotionHandle, false);
                }catch(e){}
            },
            start : function(funx){
                if(!isstart){
                    isstart = true;
                    eventHandle = funx;
                    start();
                }
            },
            pause : function(){
                ispause = true;
            },
            goon : function(){
                ispause = false;
            },
            setShake : function(threshold){
            	threshold = +threshold;
            	SHAKE_THRESHOLD = threshold < 700 ? 700 : threshold;
            }
        };
    };

    exports.Shake = DeviceMotionManager();
})(qv.zero);