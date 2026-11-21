// Tam ekran üçgen çifti (PlaneGeometry 2×2): NDC'yi parçacık gölgelendiricisine aktar
varying vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
