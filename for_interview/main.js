
/**
 * Created by v_czjzhang on 2018/4/18.
 */
// export function cube(x) {
//     return x * x * x;
// }
// export function test(){
//     console.log("test");
// }
// export let name = "zhangjing";
//
// export let obj = {
//     name:"’≈æ∏",
//     age:24,
//     getName:function(){
//         console.log(this.name);
//     }
// };

(function(){
    var myGrades = [93, 95, 88, 0, 55, 91];

    var average = function() {
        var total = myGrades.reduce(function(accumulator, item) {
            return accumulator + item}, 0);

        return 'Your average grade is ' + total / myGrades.length + '.';
    }

    var failing = function(){
        var failingGrades = myGrades.filter(function(item) {
            return item < 70;});

        return 'You failed ' + failingGrades.length + ' times.';
    }
    return average()
})();